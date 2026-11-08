//! Length-prefixed TCP frames for a read-only LabVIEW-to-native-Rust dashboard.
//! Wire format: [4-byte unsigned big-endian byte count][UTF-8 JSON payload].
//! TCP is a byte stream: always use read_exact rather than assuming one read per write.
use std::io::{self, Read, Write};

pub const MAX_FRAME: usize = 64 * 1024;

pub fn read_frame<R: Read>(r: &mut R) -> io::Result<Vec<u8>> {
    let mut hdr = [0u8; 4];
    r.read_exact(&mut hdr)?;
    let n = u32::from_be_bytes(hdr) as usize;
    if n == 0 || n > MAX_FRAME {
        return Err(io::Error::new(io::ErrorKind::InvalidData, "invalid frame length"));
    }
    let mut payload = vec![0u8; n];
    r.read_exact(&mut payload)?;
    Ok(payload)
}

pub fn write_frame<W: Write>(w: &mut W, payload: &[u8]) -> io::Result<()> {
    if payload.is_empty() || payload.len() > MAX_FRAME {
        return Err(io::Error::new(io::ErrorKind::InvalidInput, "invalid payload length"));
    }
    w.write_all(&(payload.len() as u32).to_be_bytes())?;
    w.write_all(payload)?;
    w.flush()
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Cursor;

    #[test]
    fn round_trip_two_frames() {
        let mut bytes = Vec::new();
        write_frame(&mut bytes, br#"{"type":"snapshot","sequence":1}"#).unwrap();
        write_frame(&mut bytes, br#"{"type":"snapshot","sequence":2}"#).unwrap();
        let mut cursor = Cursor::new(bytes);
        assert_eq!(read_frame(&mut cursor).unwrap().as_slice(), br#"{"type":"snapshot","sequence":1}"#);
        assert_eq!(read_frame(&mut cursor).unwrap().as_slice(), br#"{"type":"snapshot","sequence":2}"#);
    }

    #[test]
    fn rejects_zero_length() {
        let e = read_frame(&mut Cursor::new([0u8; 4])).unwrap_err();
        assert_eq!(e.kind(), io::ErrorKind::InvalidData);
    }

    #[test]
    fn rejects_oversize() {
        let n = (MAX_FRAME as u32 + 1).to_be_bytes();
        assert_eq!(read_frame(&mut Cursor::new(n)).unwrap_err().kind(), io::ErrorKind::InvalidData);
    }

    #[test]
    fn rejects_truncated_frame() {
        let mut bytes = vec![0u8, 0, 0, 6];
        bytes.extend_from_slice(b"abc");
        assert_eq!(read_frame(&mut Cursor::new(bytes)).unwrap_err().kind(), io::ErrorKind::UnexpectedEof);
    }

    #[test]
    fn rejects_empty_payload() {
        assert_eq!(write_frame(&mut Vec::new(), b"").unwrap_err().kind(), io::ErrorKind::InvalidInput);
    }
}
