const errorHandler = (error, req, res, next) => {
  if (error?.issues) {
    return res.status(400).json({
      message: 'Validation error',
      issues: error.issues,
    })
  }

  return res.status(500).json({
    message: 'Unexpected server error',
    error: error.message,
  })
}

export default errorHandler
