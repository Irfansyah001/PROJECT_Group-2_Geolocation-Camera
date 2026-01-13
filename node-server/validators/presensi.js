const { body, param, validationResult } = require("express-validator");

const toWIBIfDateOnly = (v) => {
  if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v)) {
    return `${v}T00:00:00+07:00`;
  }
  return v;
};

exports.validatePresensiUpdate = [

  param("id").isInt().withMessage("id harus angka").toInt(),

  body("waktuCheckIn")
    .optional()
    .customSanitizer(toWIBIfDateOnly)
    .isISO8601({ strict: true })
    .withMessage("waktuCheckIn harus tanggal/time ISO 8601 yang valid"),

  body("waktuCheckOut")
    .optional()
    .customSanitizer(toWIBIfDateOnly)
    .isISO8601({ strict: true })
    .withMessage("waktuCheckOut harus tanggal/time ISO 8601 yang valid"),

  body("nama").optional().isLength({ min: 1 }).withMessage("nama tidak boleh kosong"),

  body().custom((_, { req }) => {
    const { waktuCheckIn, waktuCheckOut, nama } = req.body;

    if (waktuCheckIn == null && waktuCheckOut == null && nama == null) {
      throw new Error("Kirim minimal satu field: waktuCheckIn / waktuCheckOut / nama");
    }

    if (waktuCheckIn && waktuCheckOut) {
      const inDate = new Date(waktuCheckIn);
      const outDate = new Date(waktuCheckOut);
      if (outDate < inDate) {
        throw new Error("waktuCheckOut tidak boleh lebih awal dari waktuCheckIn");
      }
    }
    return true;
  }),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ message: "Validasi gagal", errors: errors.array() });
    }
    next();
  },
];
