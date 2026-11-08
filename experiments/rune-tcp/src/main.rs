//! Standalone read-only transport proof for a future native Rune UI.
//! Deliberately does NOT instantiate Rune: isolate and verify the TCP protocol first.
use serde::Deserialize;
use serde_json::Value;
use std::collections::HashSet;
use std::io::{self, Read};
use std::net::{TcpListener, TcpStream};
use std::sync::mpsc::{self, Sender};
use std::thread;
use std::time::{Duration, SystemTime, UNIX_EPOCH};

const MAX_PACKET: usize = 65_536;
const ADDRESS: &str = "127.0.0.1:8767";

#[derive(Debug, Deserialize)]
#[serde(deny_unknown_fields)]
struct Signal {
    id: String,
    data_type: String,
    value: Value,
    unit: String,
    quality: String,
}

#[derive(Debug, Deserialize)]
#[serde(deny_unknown_fields)]
struct Telemetry {
    #[serde(rename = "type")]
    kind: String,
    schema_version: u32,
    source: String,
    sequence: u64,
    source_timestamp_ms: u64,
    signals: Vec<Signal>,
}

fn validate(frame: &Telemetry) -> Result<(), &'static str> {
    if frame.kind != "telemetry" || frame.schema_version != 1 { return Err("bad message type/version"); }
    if frame.source != "MOCK_LABVIEW" && frame.source != "LABVIEW" { return Err("bad source"); }
    if frame.signals.is_empty() || frame.signals.len() > 64 { return Err("invalid signal count"); }
    let mut ids = HashSet::new();
    for s in &frame.signals {
        if s.id.is_empty() || s.id.len() > 100 || !s.id.bytes().all(|b| b.is_ascii_alphanumeric() || b"._-".contains(&b)) || !ids.insert(s.id.as_str()) {return Err("invalid/duplicate tag id");}
        if s.unit.len() > 30 || !["Good", "Stale", "Disconnected", "Invalid"].contains(&s.quality.as_str()) {return Err("invalid quality/unit");}
        let valid = match s.data_type.as_str() {
            "Float64" | "Float32" => s.value.as_f64().is_some_and(|x| x.is_finite()),
            "Integer" => s.value.as_i64().is_some(),
            "Boolean" => s.value.is_boolean(),
            "String" | "Enum" => s.value.as_str().is_some_and(|x| x.len() <= 128),
            _ => false,
        };
        if !valid { return Err("data type/value mismatch"); }
    }
    Ok(())
}

fn read_frame(stream: &mut TcpStream) -> io::Result<Option<Telemetry>> {
    let mut header = [0_u8; 4];
    match stream.read_exact(&mut header) {
        Ok(()) => {},
        Err(e) if e.kind() == io::ErrorKind::UnexpectedEof => return Ok(None),
        Err(e) => return Err(e),
    }
    let len = u32::from_be_bytes(header) as usize;
    if len == 0 || len > MAX_PACKET {return Err(io::Error::new(io::ErrorKind::InvalidData, "frame size out of bounds"));}
    let mut payload = vec![0_u8; len];
    stream.read_exact(&mut payload)?;
    let value: Telemetry = serde_json::from_slice(&payload).map_err(|e| io::Error::new(io::ErrorKind::InvalidData,e))?;
    validate(&value).map_err(|e| io::Error::new(io::ErrorKind::InvalidData,e))?;
    Ok(Some(value))
}

fn receive(mut conn: TcpStream, tx: &Sender<Telemetry>) {
    let _ = conn.set_read_timeout(Some(Duration::from_secs(3)));
    let mut prev = None;
    while let Ok(Some(frame)) = read_frame(&mut conn) {
        if prev.is_some_and(|seq| frame.sequence <= seq) { eprintln!("Non-increasing sequence; closing connection"); break; }
        prev = Some(frame.sequence);
        if tx.send(frame).is_err() {break;}
    }
    eprintln!("LabVIEW data source disconnected; mark signals Disconnected");
}

fn main() -> io::Result<()> {
    let listener = TcpListener::bind(ADDRESS)?;
    let (tx, rx) = mpsc::channel();
    println!("Read-only PanelForge TCP proof listening on {ADDRESS}. No hardware commands.");
    thread::spawn(move || {
        for connection in listener.incoming() {
            match connection {
                Ok(conn) => receive(conn, &tx),
                Err(e) => eprintln!("TCP accept error: {e}"),
            }
        }
    });
    for frame in rx {
        let recv_at = SystemTime::now().duration_since(UNIX_EPOCH).unwrap_or_default().as_millis();
        println!("received={} source={} seq={} source_ms={} received_ms={} signals={}",frame.source,frame.kind,frame.sequence,frame.source_timestamp_ms,recv_at,frame.signals.len());
        for signal in frame.signals {println!("  {} = {} {} [{}]",signal.id,signal.value,signal.unit,signal.quality);}
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn rejects_duplicate_signals() {
        let f:Telemetry=serde_json::from_str(r#"{"type":"telemetry","schema_version":1,"source":"MOCK_LABVIEW","sequence":1,"source_timestamp_ms":1,"signals":[{"id":"a","data_type":"Float64","value":1.0,"unit":"rpm","quality":"Good"},{"id":"a","data_type":"Float64","value":2.0,"unit":"rpm","quality":"Good"}]}"#).unwrap();
        assert!(validate(&f).is_err());
    }
}
