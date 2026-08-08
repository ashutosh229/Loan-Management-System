import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDir = path.join(__dirname, "..", "..", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${req.userId}-${Date.now()}${ext}`;
    cb(null, uniqueName);
  },
});

const ALLOWED_MIME = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
const MAX_SIZE_MB = Number(process.env.MAX_UPLOAD_SIZE_MB || 5);

export const uploadSalarySlip = multer({
  storage,
  limits: { fileSize: MAX_SIZE_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME.includes(file.mimetype)) {
      cb(new Error("Only PDF, JPG, and PNG files are allowed."));
      return;
    }
    cb(null, true);
  },
});
