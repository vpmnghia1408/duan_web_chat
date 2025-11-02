import express from "express";
import { authMe, getUserById } from "../controllers/userController.js";

const router = express.Router();

router.get("/me", authMe);

router.get("/:id", getUserById);

export default router;
