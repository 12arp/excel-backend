const express = require("express");
const multer = require("multer");
const xlsx = require("xlsx");
const cors = require("cors");
const fs = require("fs");

const app = express();
const upload = multer({ dest: "uploads/" });

app.use(cors({ origin: "*" })); // Allow all origins
app.use(express.json());

app.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  try {
    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });

    fs.unlinkSync(req.file.path); // Ensure file is deleted after processing

    if (worksheet.length === 0) {
      return res.status(400).json({ error: "Uploaded file is empty" });
    }

    const headers = worksheet[0];
    const dataRows = worksheet.slice(1);
    const totalCandidates = dataRows.length;

    let columns = {};

    headers.forEach((column, colIndex) => {
      if (colIndex === 0) return; // Skip the first column (candidate IDs)
      let presentCount = 0;
      let absentIds = [];

      dataRows.forEach((row) => {
        if (row[colIndex]) {
          presentCount++;
        } else {
          absentIds.push(row[0]); // First column contains candidate IDs
        }
      });

      columns[column] = { present: presentCount, absent: absentIds };
    });

    res.json({ total_candidates: totalCandidates, columns });
  } catch (error) {
    console.error("Error processing file:", error);
    res.status(500).json({ error: "Failed to process file" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
