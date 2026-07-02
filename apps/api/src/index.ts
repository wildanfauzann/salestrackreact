import userRoutes from './routes/user.routes.js';
import attendanceRoutes from './routes/attendance.routes.js';
import leaveRoutes from './routes/leave.routes.js';
import activityRoutes from './routes/activity.routes.js';
import dealRoutes from './routes/deal.routes.js';
import customerRoutes from './routes/customer.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import targetRoutes from './routes/target.routes.js';
import express from 'express';
import cors from 'cors';
import { auth } from './auth/index.js';

const app = express();

app.use(cors({
  origin: function (origin, callback) {
    const allowed = [process.env.FRONTEND_URL, 'http://localhost:5173', 'https://salestrackreact2.netlify.app'];
    if (!origin || allowed.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/deals', dealRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/targets', targetRoutes);

import { toNodeHandler } from 'better-auth/node';

// Better Auth route
app.use("/api/auth", toNodeHandler(auth.handler));

if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

export default app;
