import React, { useState, useEffect, useRef } from "react";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { db } from "../firebase";
import { useFlashMessage } from "../components/FlashMessageContext";
import { useNavigate } from "react-router-dom";

const fields = [
  // Common fields
  { key: "name", type: "text", scope: "both" },
  { key: "hardwareVersion", type: "text", scope: "both" },
  { key: "adcResolution", type: "number", scope: "both" },
  { key: "uniqueDeviceId", type: "text", scope: "both" },

  // MM fields
  { key: "autoTestLongLengthConfig_LR1300", type: "number", scope: "MM" },
  { key: "autoTestLongLengthConfig_LR850", type: "number", scope: "MM" },
  { key: "autoTestLongLengthConfig_UR1300", type: "number", scope: "MM" },
  { key: "autoTestLongLengthConfig_UR850", type: "number", scope: "MM" },
  { key: "autoTestShortLengthConfig_LR1300", type: "number", scope: "MM" },
  { key: "autoTestShortLengthConfig_LR850", type: "number", scope: "MM" },
  { key: "autoTestShortLengthConfig_UR1300", type: "number", scope: "MM" },
  { key: "autoTestShortLengthConfig_UR850", type: "number", scope: "MM" },
  { key: "autotestLongLossConfig_LR1300", type: "number", scope: "MM" },
  { key: "autotestLongLossConfig_LR850", type: "number", scope: "MM" },
  { key: "autotestLongLossConfig_UR1300", type: "number", scope: "MM" },
  { key: "autotestLongLossConfig_UR850", type: "number", scope: "MM" },
  { key: "autotestShortLossConfig_LR1300", type: "number", scope: "MM" },
  { key: "autotestShortLossConfig_LR850", type: "number", scope: "MM" },
  { key: "autotestShortLossConfig_UR1300", type: "number", scope: "MM" },
  { key: "autotestShortLossConfig_UR850", type: "number", scope: "MM" },
  { key: "setRefLossConfig_LR850", type: "number", scope: "MM" },
  { key: "setRefLossConfig_LR1300", type: "number", scope: "MM" },
  { key: "setRefLossConfig_UR1300", type: "number", scope: "MM" },
  { key: "setRefLossConfig_UR850", type: "number", scope: "MM" },
  { key: "responsivity850", type: "number", scope: "MM" },
  { key: "responsivity1300", type: "number", scope: "MM" },

  // SM fields
  { key: "autoTestLongLengthConfig_LR1310", type: "number", scope: "SM" },
  { key: "autoTestLongLengthConfig_LR1550", type: "number", scope: "SM" },
  { key: "autoTestLongLengthConfig_UR1310", type: "number", scope: "SM" },
  { key: "autoTestLongLengthConfig_UR1550", type: "number", scope: "SM" },
  { key: "autoTestShortLengthConfig_LR1310", type: "number", scope: "SM" },
  { key: "autoTestShortLengthConfig_LR1550", type: "number", scope: "SM" },
  { key: "autoTestShortLengthConfig_UR1310", type: "number", scope: "SM" },
  { key: "autoTestShortLengthConfig_UR1550", type: "number", scope: "SM" },
  { key: "autotestLongLossConfig_LR1310", type: "number", scope: "SM" },
  { key: "autotestLongLossConfig_LR1550", type: "number", scope: "SM" },
  { key: "autotestLongLossConfig_UR1310", type: "number", scope: "SM" },
  { key: "autotestLongLossConfig_UR1550", type: "number", scope: "SM" },
  { key: "autotestShortLossConfig_LR1310", type: "number", scope: "SM" },
  { key: "autotestShortLossConfig_LR1550", type: "number", scope: "SM" },
  { key: "autotestShortLossConfig_UR1310", type: "number", scope: "SM" },
  { key: "autotestShortLossConfig_UR1550", type: "number", scope: "SM" },
  { key: "setRefLossConfig_LR1310", type: "number", scope: "SM" },
  { key: "setRefLossConfig_LR1550", type: "number", scope: "SM" },
  { key: "setRefLossConfig_UR1310", type: "number", scope: "SM" },
  { key: "setRefLossConfig_UR1550", type: "number", scope: "SM" },
  { key: "responsivity1310", type: "number", scope: "SM" },
  { key: "responsivity1550", type: "number", scope: "SM" },
];

const fieldLabels: Record<string, string> = {
  // Common
  name: "Configuration Name",
  hardwareVersion: "Hardware Version",
  adcResolution: "ADC Resolution",
  uniqueDeviceId: "Unique Device ID",
  tiaRegister: "TIA Register",
  deviceType: "Device Type",

  // MM Fields
  autoTestLongLengthConfig_LR1300: "Auto Test Long Length Config (LR 1300)",
  autoTestLongLengthConfig_LR850: "Auto Test Long Length Config (LR 850)",
  autoTestLongLengthConfig_UR1300: "Auto Test Long Length Config (UR 1300)",
  autoTestLongLengthConfig_UR850: "Auto Test Long Length Config (UR 850)",
  autoTestShortLengthConfig_LR1300: "Auto Test Short Length Config (LR 1300)",
  autoTestShortLengthConfig_LR850: "Auto Test Short Length Config (LR 850)",
  autoTestShortLengthConfig_UR1300: "Auto Test Short Length Config (UR 1300)",
  autoTestShortLengthConfig_UR850: "Auto Test Short Length Config (UR 850)",
  autotestLongLossConfig_LR1300: "Auto Test Long Loss Config (LR 1300)",
  autotestLongLossConfig_LR850: "Auto Test Long Loss Config (LR 850)",
  autotestLongLossConfig_UR1300: "Auto Test Long Loss Config (UR 1300)",
  autotestLongLossConfig_UR850: "Auto Test Long Loss Config (UR 850)",
  autotestShortLossConfig_LR1300: "Auto Test Short Loss Config (LR 1300)",
  autotestShortLossConfig_LR850: "Auto Test Short Loss Config (LR 850)",
  autotestShortLossConfig_UR1300: "Auto Test Short Loss Config (UR 1300)",
  autotestShortLossConfig_UR850: "Auto Test Short Loss Config (UR 850)",
  setRefLossConfig_LR850: "Set Reference Loss Config (LR 850)",
  setRefLossConfig_LR1300: "Set Reference Loss Config (LR 1300)",
  setRefLossConfig_UR1300: "Set Reference Loss Config (UR 1300)",
  setRefLossConfig_UR850: "Set Reference Loss Config (UR 850)",
  responsivity850: "Responsivity @ 850 nm",
  responsivity1300: "Responsivity @ 1300 nm",

  // SM Fields
  autoTestLongLengthConfig_LR1310: "Auto Test Long Length Config (LR 1310)",
  autoTestLongLengthConfig_LR1550: "Auto Test Long Length Config (LR 1550)",
  autoTestLongLengthConfig_UR1310: "Auto Test Long Length Config (UR 1310)",
  autoTestLongLengthConfig_UR1550: "Auto Test Long Length Config (UR 1550)",
  autoTestShortLengthConfig_LR1310: "Auto Test Short Length Config (LR 1310)",
  autoTestShortLengthConfig_LR1550: "Auto Test Short Length Config (LR 1550)",
  autoTestShortLengthConfig_UR1310: "Auto Test Short Length Config (UR 1310)",
  autoTestShortLengthConfig_UR1550: "Auto Test Short Length Config (UR 1550)",
  autotestLongLossConfig_LR1310: "Auto Test Long Loss Config (LR 1310)",
  autotestLongLossConfig_LR1550: "Auto Test Long Loss Config (LR 1550)",
  autotestLongLossConfig_UR1310: "Auto Test Long Loss Config (UR 1310)",
  autotestLongLossConfig_UR1550: "Auto Test Long Loss Config (UR 1550)",
  autotestShortLossConfig_LR1310: "Auto Test Short Loss Config (LR 1310)",
  autotestShortLossConfig_LR1550: "Auto Test Short Loss Config (LR 1550)",
  autotestShortLossConfig_UR1310: "Auto Test Short Loss Config (UR 1310)",
  autotestShortLossConfig_UR1550: "Auto Test Short Loss Config (UR 1550)",
  setRefLossConfig_LR1310: "Set Reference Loss Config (LR 1310)",
  setRefLossConfig_LR1550: "Set Reference Loss Config (LR 1550)",
  setRefLossConfig_UR1310: "Set Reference Loss Config (UR 1310)",
  setRefLossConfig_UR1550: "Set Reference Loss Config (UR 1550)",
  responsivity1310: "Responsivity @ 1310 nm",
  responsivity1550: "Responsivity @ 1550 nm",
};

const validateField = (key: string, value: any): string => {
  const field = fields.find((f) => f.key === key);
  if (!field) return "";

  if (value === undefined || value === null || value === "") {
    return "This field is required";
  }

  if (field.type === "text") {
    if (/\s/.test(value)) return "No spaces allowed";
  }

  if (field.type === "number") {
    const num = Number(value);
    if (isNaN(num)) return "Must be a valid number";
    if (num < 0) return "Must be a positive number or zero";
  }

  return "";
};

const CreateConfigurationPage = () => {
  const [deviceType, setDeviceType] = useState("");
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const { setFlashMessage } = useFlashMessage();
  const navigate = useNavigate();
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({}); // NEW

  useEffect(() => {
    if (deviceType === "MM") {
      setFormData((prev) => ({ ...prev, tiaRegister: 124000 }));
    } else if (deviceType === "SM") {
      setFormData((prev) => ({ ...prev, tiaRegister: 1240 }));
    }
  }, [deviceType]);

  const handleChange = (key: string, value: any) => {
    const error = validateField(key, value);

    setFormData((prev) => ({ ...prev, [key]: value }));
    setValidationErrors((prev) => {
      const updated = { ...prev };
      if (error) {
        updated[key] = error;
      } else {
        delete updated[key];
      }
      return updated;
    });
  };

  const handleSubmit = async () => {
    const newErrors: Record<string, string> = {};

    for (const { key } of fields.filter(
      (f) => f.scope === "both" || f.scope === deviceType
    )) {
      const error = validateField(key, formData[key]);
      if (error) newErrors[key] = error;
    }

    if (Object.keys(newErrors).length > 0) {
      setValidationErrors(newErrors);

      // NEW: Auto scroll to the first invalid field
      const firstErrorKey = Object.keys(newErrors)[0];
      const firstErrorElement = inputRefs.current[firstErrorKey];
      if (firstErrorElement) {
        // Give the browser a moment to render the validation error before scrolling
        setTimeout(() => {
          firstErrorElement.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
          firstErrorElement.focus({ preventScroll: true });
        }, 100);
      }

      return;
    }

    const orderedKeys = [
      "name",
      "hardwareVersion",
      "adcResolution",
      "uniqueDeviceId",
      "tiaRegister",
      "deviceType",
      ...fields.filter((f) => f.scope === deviceType).map((f) => f.key),
      "createdOn",
    ];

    const payload: Record<string, any> = {};
    for (const key of orderedKeys) {
      if (key === "createdOn") {
        payload[key] = Timestamp.now();
      } else if (key === "tiaRegister") {
        payload[key] = formData[key];
      } else if (key === "deviceType") {
        payload[key] = deviceType;
      } else {
        payload[key] = formData[key] || "";
      }
    }

    try {
      await addDoc(collection(db, "Configurations"), payload);
      setFlashMessage({
        type: "success",
        message: "Configuration created successfully!",
      });
      navigate("/configurations");
    } catch (error) {
      console.error(error);
      setFlashMessage({
        type: "danger",
        message: "Failed to create configuration.",
      });
    }
  };

  const visibleFields = fields.filter(
    (field) => field.scope === "both" || field.scope === deviceType
  );

  return (
    <div className="bg-light py-4">
      <div
        className="container d-flex"
        style={{ gap: "20px", flexWrap: "nowrap" }}
      >
        <div
          className="p-4 bg-white rounded shadow"
          style={{ flex: 1, minWidth: 0 }}
        >
          <h3 className="mb-3">Create New Configuration</h3>

          <div className="mb-4">
            <label className="form-label">Device Type</label>
            <select
              className="form-select"
              value={deviceType}
              onChange={(e) => {
                setDeviceType(e.target.value);
                setFormData({});
                setValidationErrors({});
              }}
            >
              <option value="">Select Device Type</option>
              <option value="SM">SM</option>
              <option value="MM">MM</option>
            </select>
          </div>

          {deviceType && (
            <form className="row g-3">
              {visibleFields.map(({ key, type }) => (
                <div className="col-md-6" key={key}>
                  <label className="form-label">
                    {fieldLabels[key] || key}
                  </label>
                  <input
                    type={type}
                    className={`form-control ${
                      validationErrors[key] ? "is-invalid" : ""
                    }`}
                    autoComplete="off"
                    value={formData[key] || ""}
                    onChange={(e) => handleChange(key, e.target.value)}
                    onWheel={(e) => e.currentTarget.blur()}
                    ref={(el) => {
                      inputRefs.current[key] = el;
                    }} // <-- NEW
                  />
                  {validationErrors[key] && (
                    <div className="invalid-feedback">
                      {validationErrors[key]}
                    </div>
                  )}
                </div>
              ))}

              <div className="col-md-6">
                <label className="form-label">
                  {fieldLabels["tiaRegister"]}
                </label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.tiaRegister || ""}
                  readOnly
                />
              </div>
            </form>
          )}

          <div className="col-12 d-flex mt-3">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => navigate(-1)}
            >
              Back
            </button>

            {deviceType && (
              <button
                type="button"
                className="btn btn-outline-primary ms-3"
                onClick={handleSubmit}
              >
                Create Configuration
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateConfigurationPage;
