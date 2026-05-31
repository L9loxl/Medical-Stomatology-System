import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import dashboardRouter from "./dashboard";
import patientsRouter from "./patients";
import appointmentsRouter from "./appointments";
import treatmentsRouter from "./treatments";
import paymentsRouter from "./payments";
import imagingRouter from "./imaging";
import dentalChartRouter from "./dental-chart";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(dashboardRouter);
router.use(patientsRouter);
router.use(appointmentsRouter);
router.use(treatmentsRouter);
router.use(paymentsRouter);
router.use(imagingRouter);
router.use(dentalChartRouter);

export default router;
