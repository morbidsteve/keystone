"""Script to generate sample Excel test fixtures."""

import os

try:
    from openpyxl import Workbook

    def create_logstat_template():
        """Create a sample LOGSTAT Excel file."""
        wb = Workbook()
        ws = wb.active
        ws.title = "LOGSTAT"

        # Headers
        headers = ["UNIT", "CLASS", "ITEM", "ON HAND", "AUTH", "DOS", "STATUS", "RATE"]
        ws.append(headers)

        # Data rows
        data = [
            ["1/1", "I", "MRE Cases", 350, 500, 3.5, "AMBER", 10],
            ["1/1", "III", "JP-8", 45000, 60000, 4.5, "AMBER", 1200],
            ["1/1", "V", "5.56mm Ball", 80000, 100000, 6.2, "GREEN", 2000],
            ["1/1", "VIII", "CLS Bags", 40, 50, 8.0, "GREEN", 2],
            ["1/1", "IX", "HMMWV Parts", 22, 30, 5.5, "GREEN", 3],
            ["2/1", "I", "MRE Cases", 400, 500, 4.0, "AMBER", 10],
            ["2/1", "III", "JP-8", 50000, 60000, 5.0, "GREEN", 1200],
            ["2/1", "V", "5.56mm Ball", 90000, 100000, 7.0, "GREEN", 2000],
        ]

        for row in data:
            ws.append(row)

        filepath = os.path.join(os.path.dirname(__file__), "sample_logstat.xlsx")
        wb.save(filepath)
        print(f"Created {filepath}")

    def create_equipment_template():
        """Create a sample equipment readiness Excel file."""
        wb = Workbook()
        ws = wb.active
        ws.title = "Equipment"

        headers = [
            "UNIT",
            "TAMCN",
            "NOMENCLATURE",
            "POSS",
            "MC",
            "NMCM",
            "NMCS",
            "READINESS %",
        ]
        ws.append(headers)

        data = [
            ["1/1", "D1149", "HMMWV M1151", 15, 12, 2, 1, 80.0],
            ["1/1", "E0846", "MTVR MK23", 10, 8, 1, 1, 80.0],
            ["1/1", "A2073", "LAV-25", 6, 5, 1, 0, 83.3],
            ["2/1", "D1149", "HMMWV M1151", 12, 10, 1, 1, 83.3],
            ["2/1", "E0846", "MTVR MK23", 8, 7, 1, 0, 87.5],
        ]

        for row in data:
            ws.append(row)

        filepath = os.path.join(os.path.dirname(__file__), "sample_equipment.xlsx")
        wb.save(filepath)
        print(f"Created {filepath}")

    if __name__ == "__main__":
        create_logstat_template()
        create_equipment_template()

except ImportError:
    print("openpyxl not installed, skipping sample Excel generation")
