#!/usr/bin/env python3
"""
PDF Text Extractor for CV Analysis
Extracts text content from PDF files for AI scoring system
"""

import sys
import os
import json
import PyPDF2
import pdfplumber
from pathlib import Path

def extract_text_pypdf2(pdf_path):
    """Extract text using PyPDF2"""
    try:
        with open(pdf_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            text = ""
            
            for page_num in range(len(pdf_reader.pages)):
                page = pdf_reader.pages[page_num]
                page_text = page.extract_text()
                text += page_text + "\n"
            
            return text.strip()
    except Exception as e:
        return f"PyPDF2 extraction failed: {str(e)}"

def extract_text_pdfplumber(pdf_path):
    """Extract text using pdfplumber (more accurate)"""
    try:
        text = ""
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
        
        return text.strip()
    except Exception as e:
        return f"pdfplumber extraction failed: {str(e)}"

def extract_pdf_text(pdf_path):
    """Main extraction function with fallbacks"""
    if not os.path.exists(pdf_path):
        return {"success": False, "error": f"File not found: {pdf_path}"}
    
    # Try pdfplumber first (more accurate)
    text = extract_text_pdfplumber(pdf_path)
    method = "pdfplumber"
    
    # Fallback to PyPDF2 if pdfplumber fails or returns insufficient text
    if not text or len(text) < 50 or "extraction failed" in text:
        text = extract_text_pypdf2(pdf_path)
        method = "PyPDF2"
    
    # Final validation
    if not text or len(text) < 20 or "extraction failed" in text:
        return {
            "success": False,
            "error": "Failed to extract sufficient text from PDF",
            "method": method,
            "raw_result": text
        }
    
    return {
        "success": True,
        "text": text,
        "method": method,
        "length": len(text),
        "word_count": len(text.split())
    }

def main():
    if len(sys.argv) != 2:
        print(json.dumps({"success": False, "error": "Usage: python pdf_extractor.py <pdf_path>"}))
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    result = extract_pdf_text(pdf_path)
    print(json.dumps(result, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    main()