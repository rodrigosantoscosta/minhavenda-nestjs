import 'reflect-metadata';
import { AppFactory } from '../src/app-factory';

// Vercel Serverless Function entrypoint
// All routes are rewritten here via vercel.json
export default AppFactory.getExpressApp();
