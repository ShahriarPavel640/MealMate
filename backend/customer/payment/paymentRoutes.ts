import { Request, Response, NextFunction } from 'express';
import express from 'express';
import authorization from '@/middleware/authorization.js';
import authorizeRoles from '@/middleware/authorizeRoles.js';
import { validate } from '@/middleware/validate.js';
import { initiatePaymentSchema } from './paymentSchemas.js';
import {
  handleIPN,
  initiatePayment,
  handleSuccess,
  handleFail,
  handleCancel,
} from './paymentController.js';

export default (store_id: string, store_passwd: string) => {
  const router = express.Router();
  const role = 'customer';

  router.post(
    '/initiate',
    authorization,
    authorizeRoles(role),
    validate(initiatePaymentSchema),
    (req: Request, res: Response, next: NextFunction) =>
      initiatePayment(req, res, next, store_id, store_passwd)
  );

  router.all(
    '/ipn',
    express.urlencoded({ extended: true }),
    (req: Request, res: Response, next: NextFunction) =>
      handleIPN(req, res, next, store_id, store_passwd)
  );

  router.all('/success', express.urlencoded({ extended: true }), handleSuccess);
  router.all('/fail', express.urlencoded({ extended: true }), handleFail);
  router.all('/cancel', express.urlencoded({ extended: true }), handleCancel);

  return router;
};
