use wasm_bindgen::prelude::*;
use gif::{Encoder, Frame, Repeat};

#[wasm_bindgen(start)]
pub fn init_panic_hook() {
    #[cfg(debug_assertions)]
    console_error_panic_hook::set_once();
}

#[wasm_bindgen]
pub fn encode_gif(
    frames_data: Vec<u8>,
    width: u16,
    height: u16,
    num_frames: usize,
    fps: u16,
    quality: i32,
) -> Result<Vec<u8>, JsValue> {
    // Input validation
    if quality < 1 || quality > 30 {
        return Err(JsValue::from_str("Quality must be between 1 and 30"));
    }
    if fps == 0 || fps > 60 {
        return Err(JsValue::from_str("FPS must be between 1 and 60"));
    }
    if width == 0 || height == 0 {
        return Err(JsValue::from_str("Width and height must be greater than 0"));
    }
    if num_frames == 0 {
        return Err(JsValue::from_str("Number of frames must be greater than 0"));
    }

    let frame_size = (width as usize) * (height as usize) * 4;
    if frames_data.len() != frame_size * num_frames {
        return Err(JsValue::from_str(&format!(
            "Invalid frames data length: expected {}, got {}",
            frame_size * num_frames,
            frames_data.len()
        )));
    }

    // Calculate frame delay in centiseconds (1/100 sec)
    let delay = (100.0 / fps as f32).round() as u16;
    let delay = if delay < 2 { 2 } else { delay }; // Minimum 2cs delay (50 FPS max)

    // Initialize GIF encoder
    let mut encoder = Encoder::new(Vec::new(), width, height, &[])
        .map_err(|e| JsValue::from_str(&format!("Failed to create encoder: {}", e)))?;
    
    encoder.set_repeat(Repeat::Infinite)
        .map_err(|e| JsValue::from_str(&format!("Failed to set repeat mode: {}", e)))?;

    // Process each frame
    for frame_index in 0..num_frames {
        let start = frame_index * frame_size;
        let end = start + frame_size;
        let frame_pixels = &frames_data[start..end];
        
        let mut pixels = frame_pixels.to_vec();
        let mut frame = Frame::from_rgba_speed(width, height, &mut pixels, quality);
        frame.delay = delay;
        encoder.write_frame(&frame)
            .map_err(|e| JsValue::from_str(&format!("Frame {} write failed: {}", frame_index, e)))?;
    }

    encoder.into_inner().map_err(|e| JsValue::from_str(&format!("Failed to finalize GIF encoder: {}", e)))
}

#[wasm_bindgen]
pub fn test_encode_simple() -> Result<Vec<u8>, JsValue> {
    let width = 10u16;
    let height = 10u16;
    let frame_size = (width as usize) * (height as usize) * 4;
    let mut frames_data = Vec::with_capacity(frame_size * 2);
    
    // Frame 1: Red
    for _ in 0..(width as usize * height as usize) {
        frames_data.extend_from_slice(&[255, 0, 0, 255]); // RGBA
    }
    
    // Frame 2: Blue
    for _ in 0..(width as usize * height as usize) {
        frames_data.extend_from_slice(&[0, 0, 255, 255]); // RGBA
    }
    
    encode_gif(frames_data, width, height, 2, 2, 10)
}