//! Native Rust TCP client. A Rune desktop UI can run this reader on a worker
//! thread and deliver decoded telemetry to its state via a bounded channel.
//! Does not open a browser, execute JavaScript, or send equipment commands.
use panelforge_tcp::read_frame;
use std::{net::TcpStream, thread, time::Duration};

fn main() {
    let address = std::env::args().nth(1).unwrap_or_else(|| "127.0.0.1:8767".to_string());
    eprintln!("Connecting to read-only LabVIEW TCP publisher at {address}");
    loop {
        match TcpStream::connect(&address) {
            Ok(mut socket) => {
                let _ = socket.set_read_timeout(Some(Duration::from_secs(5)));
                eprintln!("Connected");
                loop {
                    match read_frame(&mut socket) {
                        Ok(frame) => match String::from_utf8(frame) {
                            Ok(json) => println!("{json}"),
                            Err(_) => { eprintln!("Invalid UTF-8 payload; disconnecting"); break; }
                        },
                        Err(e) => { eprintln!("TCP disconnected or invalid frame: {e}"); break; }
                    }
                }
            }
            Err(e) => eprintln!("Not connected: {e}"),
        }
        thread::sleep(Duration::from_secs(2));
    }
}
