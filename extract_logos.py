from PIL import Image, ImageChops
import os

def crop_and_save(img_path, output_dir):
    try:
        img = Image.open(img_path).convert("RGBA")
        width, height = img.size
        print(f"Image size: {width}x{height}")
        
        # Define crop areas (roughly equal thirds)
        third = height // 3
        
        # MamyPoko (Top)
        mamypoko = img.crop((0, 0, width, third))
        mamypoko = process_logo(mamypoko)
        mamypoko.save(os.path.join(output_dir, "brand-mamypoko.png"))
        
        # SOFY (Middle)
        sofy = img.crop((0, third, width, 2 * third))
        sofy = process_logo(sofy)
        sofy.save(os.path.join(output_dir, "brand-sofy.png"))
        
        # Lifree (Bottom)
        lifree = img.crop((0, 2 * third, width, height))
        lifree = process_logo(lifree)
        lifree.save(os.path.join(output_dir, "brand-lifree.png"))
        
        print("Logos extracted, processed for transparency, and saved.")
    except Exception as e:
        print(f"Error: {e}")

def process_logo(im):
    # 1. Convert near-white to transparent with a softer threshold
    data = im.getdata()
    new_data = []
    for item in data:
        r, g, b, a = item
        if r > 235 and g > 235 and b > 235:
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append(item)
    im.putdata(new_data)
    
    # 2. Trim empty space
    alpha = im.getchannel('A')
    bbox = alpha.getbbox()
    if bbox:
        left, top, right, bottom = bbox
        padded_bbox = (max(0, left-2), top, min(im.width, right+2), bottom)
        return im.crop(padded_bbox)
    return im

if __name__ == "__main__":
    img_path = r"C:\Users\makso\.gemini\antigravity\brain\0edaf1f1-c825-4b39-b0c3-10c5c3c4820e\uploaded_image_1766423138623.png"
    output_dir = r"c:\Users\makso\Downloads\unicharm-operations_v8\public"
    crop_and_save(img_path, output_dir)
