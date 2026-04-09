import { Router, type IRouter } from "express";
import healthRouter from "./health";
import sitemapRouter from "./sitemap";
import categoriesRouter from "./categories";
import artistsRouter from "./artists";
import bookingsRouter from "./bookings";
import adminRouter from "./admin";
import adminUsersRouter from "./adminUsers";
import adminCredentialsRouter from "./adminCredentials";
import applicationsRouter from "./applications";
import authRouter from "./auth";
import cmsRouter from "./cms";
import blogRouter from "./blog";
import { requireAdmin } from "../middleware/auth";

const router: IRouter = Router();

router.use(healthRouter);
router.use(sitemapRouter);
router.use(authRouter);
router.use(categoriesRouter);
router.use(artistsRouter);
router.use(bookingsRouter);

router.use(applicationsRouter);
router.use(cmsRouter);
router.use(blogRouter);

router.use("/admin", requireAdmin);
router.use(adminRouter);
router.use(adminUsersRouter);
router.use(adminCredentialsRouter);

export default router;
