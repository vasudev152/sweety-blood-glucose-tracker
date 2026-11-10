ALTER TABLE "readings"
ADD CONSTRAINT "glucose_value_range"
CHECK (
    "glucose_value" >= 40
    AND "glucose_value" <= 600
);