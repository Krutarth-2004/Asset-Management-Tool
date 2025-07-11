import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useFlashMessage } from "../components/FlashMessageContext";
import { db } from "../firebase";

type Scope = "MM" | "SM" | "both";

type FieldDef = {
  key: string;
  label: string;
  type: "text" | "number";
  scope: Scope;
};

type ConfigData = Record<string, any>;

// Extra system field labels
const extraLabels: Record<string, string> = {
  tiaRegister: "TIA Register",
  deviceType: "Device Type",
  createdOn: "Created On",
};

// Convert extraLabels into field definitions with scope: 'both'
const extraFields: FieldDef[] = Object.entries(extraLabels).map(
  ([key, label]) => ({
    key,
    label,
    type: key === "createdOn" ? "text" : "text",
    scope: "both",
  })
);

// All editable fields with labels and scope
const fields = [
  { key: "name", label: "Configuration Name", type: "text", scope: "both" },
  {
    key: "hardwareVersion",
    label: "Hardware Version",
    type: "text",
    scope: "both",
  },
  {
    key: "adcResolution",
    label: "ADC Resolution",
    type: "number",
    scope: "both",
  },
  {
    key: "uniqueDeviceId",
    label: "Unique Device ID",
    type: "text",
    scope: "both",
  },

  // MM-specific
  {
    key: "autoTestLongLengthConfig_LR1300",
    label: "Auto Test Long Length Config (LR1300)",
    type: "number",
    scope: "MM",
  },
  {
    key: "autoTestLongLengthConfig_LR850",
    label: "Auto Test Long Length Config (LR850)",
    type: "number",
    scope: "MM",
  },
  {
    key: "autoTestLongLengthConfig_UR1300",
    label: "Auto Test Long Length Config (UR1300)",
    type: "number",
    scope: "MM",
  },
  {
    key: "autoTestLongLengthConfig_UR850",
    label: "Auto Test Long Length Config (UR850)",
    type: "number",
    scope: "MM",
  },
  {
    key: "autoTestShortLengthConfig_LR1300",
    label: "Auto Test Short Length Config (LR1300)",
    type: "number",
    scope: "MM",
  },
  {
    key: "autoTestShortLengthConfig_LR850",
    label: "Auto Test Short Length Config (LR850)",
    type: "number",
    scope: "MM",
  },
  {
    key: "autoTestShortLengthConfig_UR1300",
    label: "Auto Test Short Length Config (UR1300)",
    type: "number",
    scope: "MM",
  },
  {
    key: "autoTestShortLengthConfig_UR850",
    label: "Auto Test Short Length Config (UR850)",
    type: "number",
    scope: "MM",
  },
  {
    key: "autotestLongLossConfig_LR1300",
    label: "Auto Test Long Loss Config (LR1300)",
    type: "number",
    scope: "MM",
  },
  {
    key: "autotestLongLossConfig_LR850",
    label: "Auto Test Long Loss Config (LR850)",
    type: "number",
    scope: "MM",
  },
  {
    key: "autotestLongLossConfig_UR1300",
    label: "Auto Test Long Loss Config (UR1300)",
    type: "number",
    scope: "MM",
  },
  {
    key: "autotestLongLossConfig_UR850",
    label: "Auto Test Long Loss Config (UR850)",
    type: "number",
    scope: "MM",
  },
  {
    key: "autotestShortLossConfig_LR1300",
    label: "Auto Test Short Loss Config (LR1300)",
    type: "number",
    scope: "MM",
  },
  {
    key: "autotestShortLossConfig_LR850",
    label: "Auto Test Short Loss Config (LR850)",
    type: "number",
    scope: "MM",
  },
  {
    key: "autotestShortLossConfig_UR1300",
    label: "Auto Test Short Loss Config (UR1300)",
    type: "number",
    scope: "MM",
  },
  {
    key: "autotestShortLossConfig_UR850",
    label: "Auto Test Short Loss Config (UR850)",
    type: "number",
    scope: "MM",
  },
  {
    key: "setRefLossConfig_LR850",
    label: "Set Ref Loss Config (LR850)",
    type: "number",
    scope: "MM",
  },
  {
    key: "setRefLossConfig_LR1300",
    label: "Set Ref Loss Config (LR1300)",
    type: "number",
    scope: "MM",
  },
  {
    key: "setRefLossConfig_UR1300",
    label: "Set Ref Loss Config (UR1300)",
    type: "number",
    scope: "MM",
  },
  {
    key: "setRefLossConfig_UR850",
    label: "Set Ref Loss Config (UR850)",
    type: "number",
    scope: "MM",
  },
  {
    key: "responsivity850",
    label: "Responsivity @ 850 nm",
    type: "number",
    scope: "MM",
  },
  {
    key: "responsivity1300",
    label: "Responsivity @ 1300 nm",
    type: "number",
    scope: "MM",
  },

  // SM-specific
  {
    key: "autoTestLongLengthConfig_LR1310",
    label: "Auto Test Long Length Config (LR1310)",
    type: "number",
    scope: "SM",
  },
  {
    key: "autoTestLongLengthConfig_LR1550",
    label: "Auto Test Long Length Config (LR1550)",
    type: "number",
    scope: "SM",
  },
  {
    key: "autoTestLongLengthConfig_UR1310",
    label: "Auto Test Long Length Config (UR1310)",
    type: "number",
    scope: "SM",
  },
  {
    key: "autoTestLongLengthConfig_UR1550",
    label: "Auto Test Long Length Config (UR1550)",
    type: "number",
    scope: "SM",
  },
  {
    key: "autoTestShortLengthConfig_LR1310",
    label: "Auto Test Short Length Config (LR1310)",
    type: "number",
    scope: "SM",
  },
  {
    key: "autoTestShortLengthConfig_LR1550",
    label: "Auto Test Short Length Config (LR1550)",
    type: "number",
    scope: "SM",
  },
  {
    key: "autoTestShortLengthConfig_UR1310",
    label: "Auto Test Short Length Config (UR1310)",
    type: "number",
    scope: "SM",
  },
  {
    key: "autoTestShortLengthConfig_UR1550",
    label: "Auto Test Short Length Config (UR1550)",
    type: "number",
    scope: "SM",
  },
  {
    key: "autotestLongLossConfig_LR1310",
    label: "Auto Test Long Loss Config (LR1310)",
    type: "number",
    scope: "SM",
  },
  {
    key: "autotestLongLossConfig_LR1550",
    label: "Auto Test Long Loss Config (LR1550)",
    type: "number",
    scope: "SM",
  },
  {
    key: "autotestLongLossConfig_UR1310",
    label: "Auto Test Long Loss Config (UR1310)",
    type: "number",
    scope: "SM",
  },
  {
    key: "autotestLongLossConfig_UR1550",
    label: "Auto Test Long Loss Config (UR1550)",
    type: "number",
    scope: "SM",
  },
  {
    key: "autotestShortLossConfig_LR1310",
    label: "Auto Test Short Loss Config (LR1310)",
    type: "number",
    scope: "SM",
  },
  {
    key: "autotestShortLossConfig_LR1550",
    label: "Auto Test Short Loss Config (LR1550)",
    type: "number",
    scope: "SM",
  },
  {
    key: "autotestShortLossConfig_UR1310",
    label: "Auto Test Short Loss Config (UR1310)",
    type: "number",
    scope: "SM",
  },
  {
    key: "autotestShortLossConfig_UR1550",
    label: "Auto Test Short Loss Config (UR1550)",
    type: "number",
    scope: "SM",
  },
  {
    key: "setRefLossConfig_LR1310",
    label: "Set Ref Loss Config (LR1310)",
    type: "number",
    scope: "SM",
  },
  {
    key: "setRefLossConfig_LR1550",
    label: "Set Ref Loss Config (LR1550)",
    type: "number",
    scope: "SM",
  },
  {
    key: "setRefLossConfig_UR1310",
    label: "Set Ref Loss Config (UR1310)",
    type: "number",
    scope: "SM",
  },
  {
    key: "setRefLossConfig_UR1550",
    label: "Set Ref Loss Config (UR1550)",
    type: "number",
    scope: "SM",
  },
  {
    key: "responsivity1310",
    label: "Responsivity @ 1310 nm",
    type: "number",
    scope: "SM",
  },
  {
    key: "responsivity1550",
    label: "Responsivity @ 1550 nm",
    type: "number",
    scope: "SM",
  },
  ...extraFields,
];

const commonKeys = [
  "name",
  "hardwareVersion",
  "adcResolution",
  "uniqueDeviceId",
];
const systemKeys = ["tiaRegister", "deviceType"];
const createdKey = "createdOn";

const getOrderedKeysFromData = (data: ConfigData): string[] => {
  const deviceFields = fields
    .filter((f) => f.scope === data?.deviceType)
    .map((f) => f.key);
  return [...commonKeys, ...systemKeys, ...deviceFields, createdKey];
};

const EditConfigurationPage: React.FC = () => {
  const { id } = useParams();
  const [configData, setConfigData] = useState<ConfigData | null>(null);
  const [formState, setFormState] = useState<ConfigData>({});
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { setFlashMessage } = useFlashMessage();
  const navigate = useNavigate();

  // 🔽 Create fieldRefs to scroll to invalid inputs
  const fieldRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const validateField = (key: string, value: any): string => {
    const fieldDef = fields.find((f) => f.key === key);
    if (!fieldDef) return "";

    const strValue = String(value ?? "").trim();

    if (strValue === "") return "This field is required";

    if (fieldDef.type === "text" && /\s/.test(strValue)) {
      return "No spaces allowed";
    }

    if (fieldDef.type === "number") {
      const number = Number(strValue);
      if (isNaN(number) || number < 0)
        return "Must be a positive number or zero";
    }

    return "";
  };

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const configRef = doc(db, "Configurations", id!);
        const configSnap = await getDoc(configRef);
        if (configSnap.exists()) {
          const data = configSnap.data();
          setConfigData(data);
          setFormState(() => {
            const initialState: Record<string, any> = {};
            const activeKeys = getOrderedKeysFromData(data);
            activeKeys.forEach((key) => {
              initialState[key] = data[key] ?? "";
            });
            return initialState;
          });
        } else {
          setFlashMessage({
            type: "danger",
            message: "Configuration not found.",
          });
        }
      } catch (error) {
        console.error("Error fetching config:", error);
        setFlashMessage({
          type: "danger",
          message: "Error fetching configuration data.",
        });
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchConfig();
  }, [id, setFlashMessage]);

  const handleChange = (key: string, rawValue: string) => {
    const def = fields.find((f) => f.key === key);
    const valueToSet =
      def?.type === "number"
        ? rawValue === ""
          ? ""
          : Number(rawValue)
        : rawValue;
    const error = validateField(key, valueToSet);

    setFormState((prev) => ({ ...prev, [key]: valueToSet }));
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

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    Object.keys(formState).forEach((key) => {
      const fieldDef = fields.find((f) => f.key === key);
      if (!fieldDef || key === "createdOn") return;

      if (
        fieldDef.scope === "both" ||
        fieldDef.scope === configData?.deviceType
      ) {
        const value = formState[key];
        const error = validateField(key, value);
        if (error) {
          newErrors[key] = error;
        }
      }
    });

    setValidationErrors(newErrors);

    // 🔽 Auto-scroll to first error
    const firstErrorKey = Object.keys(newErrors)[0];
    if (firstErrorKey && fieldRefs.current[firstErrorKey]) {
      setTimeout(() => {
        fieldRefs.current[firstErrorKey]?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        fieldRefs.current[firstErrorKey]?.focus({ preventScroll: true });
      }, 100);
    }

    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    const isValid = validateForm();
    if (!isValid) return;

    setSaving(true);
    try {
      await updateDoc(doc(db, "Configurations", id), formState);
      setFlashMessage({
        type: "success",
        message: "Configuration updated successfully.",
      });
      navigate(-1);
    } catch (error) {
      console.error("Update failed:", error);
      setFlashMessage({
        type: "danger",
        message: "Failed to update configuration.",
      });
    } finally {
      setSaving(false);
    }
  };

  const getOrderedKeys = (): string[] => {
    if (!configData) return [];
    return getOrderedKeysFromData(configData);
  };

  const renderField = (key: string) => {
    const value = formState?.[key];
    if (value === undefined) return null;

    const fieldDef = fields.find((f) => f.key === key);
    const label = fieldDef?.label || key;
    const error = validationErrors[key];

    if (key === "createdOn" && value?.toDate) {
      return (
        <div className="col-md-6 mb-3" key={key}>
          <div className="border rounded p-3 h-100 bg-light">
            <div className="fw-bold mb-1">{label}</div>
            <div>
              {value.toDate().toLocaleString("en-IN", {
                dateStyle: "medium",
                timeStyle: "medium",
              })}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="col-md-6 mb-3" key={key}>
        <div className="border rounded p-3 h-100">
          <label htmlFor={key} className="fw-bold mb-1">
            {label}
          </label>
          <input
            id={key}
            ref={(el) => {
              fieldRefs.current[key] = el;
            }} // 👈 Attach the ref
            name={`no-autofill-${key}`}
            className={`form-control ${error ? "is-invalid" : ""}`}
            type={fieldDef?.type === "number" ? "number" : "text"}
            autoComplete="off"
            inputMode={fieldDef?.type === "number" ? "decimal" : undefined}
            value={value === undefined ? "" : value}
            onChange={(e) => handleChange(key, e.target.value)}
          />
          {error && <div className="invalid-feedback">{error}</div>}
        </div>
      </div>
    );
  };

  return (
    <div className="container py-4" style={{ maxWidth: "900px" }}>
      <div className="p-4 bg-white rounded shadow">
        <h5 className="mb-4">Edit Configuration</h5>

        {loading ? (
          <div className="d-flex justify-content-center py-4">
            <div className="spinner-border" />
          </div>
        ) : (
          <form className="row" autoComplete="off" onSubmit={handleSave}>
            {getOrderedKeys().map(renderField)}

            <div className="d-flex justify-content-start gap-2 mt-4">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => navigate(-1)}
                disabled={saving}
              >
                Back
              </button>
              <button
                type="submit"
                className="btn btn-outline-primary"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default EditConfigurationPage;
