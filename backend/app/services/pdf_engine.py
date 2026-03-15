from fpdf import FPDF
import os

class ProposalPDF(FPDF):
    def header(self):
        # Branding bar
        self.set_fill_color(30, 58, 138) # Navy Blue
        self.rect(0, 0, 210, 20, 'F')
        self.set_text_color(255, 255, 255)
        self.set_font("helvetica", "B", 16)
        self.cell(0, 10, "  AgentIQ Proposal", ln=True, align='L')
        self.ln(10)

    def footer(self):
        self.set_y(-15)
        self.set_font("helvetica", "I", 8)
        self.set_text_color(128, 128, 128)
        self.cell(0, 10, f"Page {self.page_no()}", align='C')

def generate_proposal_pdf(content: str, filename: str):
    # Ensure filename ends in .pdf
    if not filename.endswith(".pdf"):
        filename += ".pdf"
        
    pdf = ProposalPDF()
    pdf.add_page()
    pdf.set_text_color(0, 0, 0)
    pdf.set_font("helvetica", size=11)
    
    # FIX: Replace common UTF-8 characters that break FPDF
    # This prevents the 'Latin-1' encoding crash
    clean_text = content.encode('latin-1', 'ignore').decode('latin-1')
    
    # Remove basic markdown
    clean_text = clean_text.replace("**", "").replace("#", "")
    
    # Write content
    pdf.multi_cell(0, 7, txt=clean_text)
    
    # Create directory if missing
    output_dir = "data/proposals"
    os.makedirs(output_dir, exist_ok=True)
    
    output_path = os.path.join(output_dir, filename)
    pdf.output(output_path)
    
    return output_path