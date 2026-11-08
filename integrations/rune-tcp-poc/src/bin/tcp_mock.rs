//! Rust-only mock publisher for transport testing without LabVIEW.
//! Binds loopback only, never sends actual equipment commands or results.
use panelforge_tcp::write_frame;
use std::{net::TcpListener, thread, time::{Duration, SystemTime, UNIX_EPOCH}};

fn main() -> std::io::Result<()> {
    let listener = TcpListener::bind("127.0.0.1:8767")?;
    eprintln!("MOCK ONLY listening on 127.0.0.1:8767");
    for accepted in listener.incoming() {
        let Ok(mut socket) = accepted else {continue};
        let _ = socket.set_write_timeout(Some(Duration::from_secs(2)));
        thread::spawn(move || {
            let mut sequence: u64 = 0;
            loop {
                let now = SystemTime::now().duration_since(UNIX_EPOCH).unwrap_or_default().as_millis();
                let speed = 1450.0 + 220.0 * ((sequence as f64) / 20.0).sin();
                let torque = 115.0 + 15.0 * ((sequence as f64) / 31.0).cos();
                let json = format!(
                    "{{\"type\":\"snapshot\",\"schema_version\":1,\"mode\":\"MOCK_ONLY\",\"sequence\":{sequence},\"signals\":[{{\"id\":\"motor.speed\",\"data_type\":\"Float64\",\"unit\":\"rpm\",\"value\":{speed:.2},\"quality\":\"Good\",\"source_timestamp_ms\":{now},\"gateway_timestamp_ms\":{now}}},{{\"id\":\"motor.torque\",\"data_type\":\"Float64\",\"unit\":\"Nm\",\"value\":{torque:.2},\"quality\":\"Good\",\"source_timestamp_ms\":{now},\"gateway_timestamp_ms\":{now}}}]}}"
                );
                if write_frame(&mut socket, json.as_bytes()).is_err() {break;}
                sequence += 1;
                thread::sleep(Duration::from_millis(250));
            }
        });
    }
    Ok(())
}
