import sys
import re
try:
    import easyocr
except ImportError:
    print("Error: easyocr is not installed.")
    print("Please install it using: pip install easyocr opencv-python-headless")
    sys.exit(1)

def analyze_cliq_receipt(image_path, expected_alias="osamawear", expected_amount=None):
    """
    Analyzes a CliQ payment receipt screenshot to verify transaction details.
    
    Args:
        image_path (str): Path to the uploaded receipt screenshot.
        expected_alias (str): The alias we expect the money to be sent to.
        expected_amount (float, optional): The exact amount expected for the order.
        
    Returns:
        dict: A dictionary containing the extracted data and validation status.
    """
    print(f"Analyzing receipt: {image_path}...")
    
    # Initialize the OCR reader (Loads models for English/Arabic if needed)
    # We use 'en' by default since CliQ receipts usually have English numbers and dates
    # Add 'ar' to the list if the UI is in Arabic: ['en', 'ar']
    reader = easyocr.Reader(['en'], gpu=False)
    
    # Read the text from the image
    result = reader.readtext(image_path, detail=0)
    full_text = " ".join(result).lower()
    print("\n--- Extracted Text ---")
    print(full_text)
    print("----------------------\n")
    
    # 1. Check if it's sent to the correct alias
    # Look for the exact alias string in the text
    to_who = expected_alias.lower()
    is_correct_alias = to_who in full_text
    
    # 2. Extract the amount paid
    # Looks for a number that usually has decimals or immediately follows JOD/JD
    # E.g., "15.00", "JOD 25.50", "25"
    money = None
    money_pattern = r'(\d{1,4}\.\d{2})'
    money_match = re.search(money_pattern, full_text)
    if money_match:
        money = float(money_match.group(1))
    
    # 3. Extract the date
    # Looks for DD/MM/YYYY or DD-MM-YYYY formats 
    date_sent = None
    date_pattern = r'(\d{2}[/-]\d{2}[/-]\d{4})'
    date_match = re.search(date_pattern, full_text)
    if date_match:
        date_sent = date_match.group(1)
        
    # Analyze the results
    is_valid = True
    errors = []
    
    if not is_correct_alias:
        is_valid = False
        errors.append(f"Alias '{expected_alias}' was not found in the receipt.")
        
    if expected_amount and money != expected_amount:
        is_valid = False
        errors.append(f"Amount mismatch. Expected: {expected_amount}, Found: {money}")
        
    return {
        "is_valid": is_valid,
        "extracted_date": date_sent,
        "extracted_money": money,
        "alias_found": is_correct_alias,
        "errors": errors
    }

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python cliq_validator.py <path_to_receipt_image> [expected_amount]")
        sys.exit(1)
        
    receipt_path = sys.argv[1]
    amount = float(sys.argv[2]) if len(sys.argv) > 2 else None
    
    # Default alias to check is "osamawear" based on the frontend config
    results = analyze_cliq_receipt(receipt_path, expected_alias="osamawear", expected_amount=amount)
    
    print("=== Validation Results ===")
    print(f"Valid Payment:  {'✅ YES' if results['is_valid'] else '❌ NO'}")
    print(f"Amount Found:   {results['extracted_money']} JOD")
    print(f"Date Found:     {results['extracted_date']}")
    print(f"Alias Matched:  {'✅ YES' if results['alias_found'] else '❌ NO'}")
    
    if not results['is_valid']:
        print("\nErrors identified:")
        for err in results['errors']:
            print(f"- {err}")
