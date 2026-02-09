export const asyncHandler = (controllerFn) => async (req, res, next) => {
  try {
    await controllerFn(req, res, next);
  } catch (error) {
    next(error);
  }
};
