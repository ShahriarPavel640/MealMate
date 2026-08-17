import { z } from 'zod';

export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    console.log('ZOD ERROR:', JSON.stringify(result.error, null, 2));
    console.log('ZOD ISSUES:', result.error.issues);
    return res.status(400).json({
      success: false,
      message: result.error.issues[0].message
    });
  }
  req.body = result.data;
  next();
};



