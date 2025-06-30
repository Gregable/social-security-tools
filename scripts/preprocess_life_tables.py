import csv
import json
import os


def preprocess_life_tables(
    input_dir="data", output_dir="static/data/processed"
):
    """
    Preprocesses the raw life table CSV files into year- and gender-specific JSON files.
    Data source: https://www.ssa.gov/OACT/Downloadables/CY/index.html
    """
    os.makedirs(output_dir, exist_ok=True)

    files = {
        "female": os.path.join(input_dir, "CohLifeTables_F_Alt2_TR2025.csv"),
        "male": os.path.join(input_dir, "CohLifeTables_M_Alt2_TR2025.csv"),
    }

    for gender, filepath in files.items():
        print(f"Processing {gender} data from {filepath}...")
        life_data = {}  # Stores data by year: {year: [{x: ..., q_x: ...}, ...]}

        with open(filepath, "r", newline="", encoding="utf-8") as csvfile:
            reader = csv.reader(csvfile)
            # Skip header rows (first 6 lines)
            for _ in range(6):
                next(reader)

            for row in reader:
                if not row:  # Skip empty rows
                    continue
                try:
                    year = int(row[0])
                    x = int(row[1])
                    q_x = float(row[2])

                    if year not in life_data:
                        life_data[year] = []
                    life_data[year].append({"x": x, "q_x": q_x})
                except (ValueError, IndexError) as e:
                    print(f"Skipping row due to parsing error: {row} - {e}")
                    continue

        # Write data to year-specific JSON files
        for year, entries in life_data.items():
            output_filepath = os.path.join(output_dir, f"{gender}_{year}.json")
            with open(output_filepath, "w", encoding="utf-8") as jsonfile:
                json.dump(entries, jsonfile, indent=2)
            print(
                f"Wrote {len(entries)} entries for {gender} year {year} to {output_filepath}"
            )


if __name__ == "__main__":
    preprocess_life_tables()
