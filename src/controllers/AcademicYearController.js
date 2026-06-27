import AcademicYear from '../models/AcademicYear.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';

export const getAllAcademicYears = catchAsync(async (req, res, next) => {
  const years = await AcademicYear.find().sort({ startDate: -1 });

  res.status(200).json({
    status: 'success',
    results: years.length,
    data: years,
  });
});

export const createAcademicYear = catchAsync(async (req, res, next) => {
  const count = await AcademicYear.countDocuments();
  if (count === 0) {
    req.body.isActive = true;
  }
  const newYear = await AcademicYear.create(req.body);

  res.status(201).json({
    status: 'success',
    data: newYear,
  });
});

export const updateAcademicYear = catchAsync(async (req, res, next) => {
  if (req.body.isActive === true) {
    await AcademicYear.updateMany(
      { _id: { $ne: req.params.id } },
      { $set: { isActive: false } }
    );
  }

  const year = await AcademicYear.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!year) {
    return next(new AppError('No academic year found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: year,
  });
});

export const deleteAcademicYear = catchAsync(async (req, res, next) => {
  const mongoose = await import('mongoose');
  const year = await AcademicYear.findById(req.params.id);

  if (!year) {
    return next(new AppError('No academic year found with that ID', 404));
  }

  if (year.isActive) {
    return next(new AppError('Cannot delete the active academic year', 400));
  }

  const [feeStructuresCount, feeCategoriesCount, ledgersCount] = await Promise.all([
    mongoose.default.model('FeeStructure').countDocuments({ academicYear: year.name }),
    mongoose.default.model('FeeCategory').countDocuments({ academicYear: year.name }),
    mongoose.default.model('StudentFeeLedger').countDocuments({ academicYear: year.name })
  ]);

  if (feeStructuresCount > 0 || feeCategoriesCount > 0 || ledgersCount > 0) {
    return next(new AppError(`Cannot delete academic year because it has associated data: ${feeStructuresCount} fee structures, ${feeCategoriesCount} fee categories, ${ledgersCount} ledgers`, 400));
  }

  await AcademicYear.findByIdAndDelete(req.params.id);

  res.status(204).json({
    status: 'success',
    data: null,
  });
});
