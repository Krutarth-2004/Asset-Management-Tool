import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

// Fields with labels and scopes
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

  // MM-specific...
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

  // SM-specific...
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
];

// Optional labels for common/system fields
const extraLabels: Record<string, string> = {
  tiaRegister: "TIA Register",
  deviceType: "Device Type",
  createdOn: "Created On",
};

const ConfigurationInfoPage: React.FC = () => {
  const { id } = useParams();
  const [configData, setConfigData] = useState<any | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchConfig = async () => {
      const configRef = doc(db, "Configurations", id!);
      const configSnap = await getDoc(configRef);
      if (configSnap.exists()) {
        setConfigData(configSnap.data());
      } else {
        setConfigData(null);
      }
    };

    fetchConfig();
  }, [id]);

  const commonKeys = [
    "name",
    "hardwareVersion",
    "adcResolution",
    "uniqueDeviceId",
  ];
  const systemKeys = ["tiaRegister", "deviceType"];
  const createdKey = "createdOn";

  const orderedKeys = [
    ...commonKeys,
    ...systemKeys,
    ...(configData
      ? fields
          .filter((f) => f.scope === configData.deviceType)
          .map((f) => f.key)
      : []),
    createdKey,
  ];

  const renderField = (key: string) => {
    const value = configData?.[key];
    if (value === undefined) return null;

    const fieldDef = fields.find((f) => f.key === key);
    const label = fieldDef?.label || extraLabels[key] || key;

    let displayValue: string;

    if (
      key === "createdOn" &&
      value &&
      typeof value === "object" &&
      "toDate" in value
    ) {
      displayValue = value.toDate().toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "medium",
      });
    } else if (typeof value === "object") {
      displayValue = JSON.stringify(value);
    } else {
      displayValue = String(value);
    }

    return (
      <div className="col-md-6 mb-3" key={key}>
        <div className="border rounded p-3 h-100">
          <div className="fw-bold mb-1">{label}</div>
          <div>{displayValue}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="container py-4" style={{ maxWidth: "900px" }}>
      <div className="p-4 bg-white rounded shadow">
        <h5 className="mb-4">Configuration Info</h5>

        {!configData ? (
          <div className="d-flex justify-content-center align-items-center py-3">
            <div className="spinner-border text-muted" role="status">
              <span className="visually-hidden">Loading configuration...</span>
            </div>
          </div>
        ) : (
          <div className="row">{orderedKeys.map(renderField)}</div>
        )}

        <div className="d-flex justify-content-start gap-2 mt-3">
          <button
            className="btn btn-outline-secondary"
            onClick={() => navigate(-1)}
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfigurationInfoPage;
