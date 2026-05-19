import { Router, type IRouter } from "express";
import healthRouter from "./health";
import waitlistRouter from "./waitlist";
import demoRouter from "./demo";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(waitlistRouter);
router.use(demoRouter);
router.use(adminRouter);

export default router;
