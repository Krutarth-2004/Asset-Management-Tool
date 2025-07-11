// CreateJobs.tsx
import React, { useState, useEffect, useRef } from "react";
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  addDoc,
  Timestamp,
  where,
} from "firebase/firestore";
import { db } from "../firebase";
import { useFlashMessage } from "../components/FlashMessageContext";
import { useNavigate } from "react-router-dom";

type JobForm = {
  mode: "automatic" | "manual";
  finalMode: "automatic" | "manual";
  jobName: string;
  jobType: string;
  prefix: string;
  suffix: string;
  start: string;
  totalDevices: string;
  manualSerialInput: string;
  finalPrefix: string;
  finalSuffix: string;
  finalStart: string;
  finalTotalDevices: string;
  manualFinalSerialInput: string;
};

const initialForm: JobForm = {
  mode: "automatic",
  finalMode: "automatic",
  jobName: "",
  jobType: "",
  prefix: "",
  suffix: "",
  start: "",
  totalDevices: "",
  manualSerialInput: "",
  finalPrefix: "",
  finalSuffix: "",
  finalStart: "",
  finalTotalDevices: "",
  manualFinalSerialInput: "",
};

type FieldKey = keyof JobForm;

const CreateJobPage: React.FC = () => {
  const [form, setForm] = useState<JobForm>(initialForm);
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const { setFlashMessage } = useFlashMessage();
  const navigate = useNavigate();
  const jobNameTimer = useRef<NodeJS.Timeout | null>(null);
  const [autoState, setAutoState] = useState({
    prefix: "",
    start: "",
    suffix: "",
    totalDevices: "",
  });

  const [finalAutoState, setFinalAutoState] = useState({
    finalPrefix: "",
    finalStart: "",
    finalSuffix: "",
    finalTotalDevices: "",
  });

  const fieldRefs: Record<FieldKey, React.RefObject<any>> = {
    jobName: useRef(null),
    jobType: useRef(null),
    prefix: useRef(null),
    suffix: useRef(null),
    start: useRef(null),
    totalDevices: useRef(null),
    manualSerialInput: useRef(null),
    finalPrefix: useRef(null),
    finalSuffix: useRef(null),
    finalStart: useRef(null),
    finalTotalDevices: useRef(null),
    manualFinalSerialInput: useRef(null),
    mode: useRef(null),
    finalMode: useRef(null),
  };

  const getEnd = () => {
    const start = parseInt(form.start);
    const total = parseInt(form.totalDevices);
    if (isNaN(start) || isNaN(total)) return "";
    return (start + total - 1).toString().padStart(form.start.length, "0");
  };

  const getFinalEnd = () => {
    const start = parseInt(form.finalStart);
    const total = parseInt(form.finalTotalDevices);
    if (isNaN(start) || isNaN(total)) return "";
    return (start + total - 1).toString().padStart(form.finalStart.length, "0");
  };

  const totalManualDevices = form.manualSerialInput
    .split("\n")
    .filter((s) => s.trim()).length;

  const totalManualFinalDevices = form.manualFinalSerialInput
    .split("\n")
    .filter((s) => s.trim()).length;

  const isNumeric = (val: string) => /^\d+$/.test(val);
  const isPositive = (val: string) => !isNaN(+val) && +val >= 0;

  const validateField = (key: FieldKey, value: string): string => {
    const stringFields = [
      "jobName",
      "prefix",
      "suffix",
      "start",
      "finalPrefix",
      "finalSuffix",
      "finalStart",
    ];

    const numberFields = ["totalDevices", "finalTotalDevices"];

    if (stringFields.includes(key)) {
      if (!value.trim()) return "This field is required.";
      if (/\s/.test(value)) return "No spaces allowed.";
    }

    if (numberFields.includes(key)) {
      if (!value.trim()) {
        // ✨ Skip validation for totalDevices fields if mode is manual
        if (
          (key === "totalDevices" && form.mode === "manual") ||
          (key === "finalTotalDevices" && form.finalMode === "manual")
        ) {
          return "";
        }

        return "This field is required";
      }
      const num = Number(value);
      if (isNaN(num) || num < 0) return "Must be a positive number or zero.";
    }

    if (["manualSerialInput", "manualFinalSerialInput"].includes(key)) {
      if (!value.trim()) return "This field is required.";
      const hasSpace = value
        .split("\n")
        .some((line) => line.trim().includes(" "));
      if (hasSpace) return "No spaces allowed in serials.";
    }

    if (key === "jobType") {
      if (!value.trim()) return "This field is required.";
    }

    return "";
  };

  const handleChange = (key: FieldKey, value: string) => {
    setForm((prev) => {
      let updatedForm = { ...prev, [key]: value };

      // ✨ Save or restore automatic values when mode changes
      if (key === "mode") {
        if (value === "manual") {
          // Save automatic fields
          setAutoState({
            prefix: prev.prefix,
            start: prev.start,
            suffix: prev.suffix,
            totalDevices: prev.totalDevices,
          });

          // Clear automatic fields when switching to manual
          updatedForm = {
            ...updatedForm,
            prefix: "",
            start: "",
            suffix: "",
            totalDevices: "",
          };
        } else if (value === "automatic") {
          // Restore automatic fields
          updatedForm = {
            ...updatedForm,
            prefix: autoState.prefix,
            start: autoState.start,
            suffix: autoState.suffix,
            totalDevices: autoState.totalDevices,
          };
        }
      }

      // ✨ Same for finalMode
      if (key === "finalMode") {
        if (value === "manual") {
          setFinalAutoState({
            finalPrefix: prev.finalPrefix,
            finalStart: prev.finalStart,
            finalSuffix: prev.finalSuffix,
            finalTotalDevices: prev.finalTotalDevices,
          });

          updatedForm = {
            ...updatedForm,
            finalPrefix: "",
            finalStart: "",
            finalSuffix: "",
            finalTotalDevices: "",
          };
        } else if (value === "automatic") {
          updatedForm = {
            ...updatedForm,
            finalPrefix: finalAutoState.finalPrefix,
            finalStart: finalAutoState.finalStart,
            finalSuffix: finalAutoState.finalSuffix,
            finalTotalDevices: finalAutoState.finalTotalDevices,
          };
        }
      }

      return updatedForm;
    });

    // Validate and clear errors as user types
    const error = validateField(key, value);
    setErrors((prev) => ({ ...prev, [key]: error || undefined }));
  };

  const validateForm = () => {
    const newErrors: Partial<Record<FieldKey, string>> = {};

    for (const key in form) {
      const fieldKey = key as FieldKey;

      if (
        form.mode === "manual" &&
        ["prefix", "start", "suffix", "totalDevices"].includes(fieldKey)
      )
        continue;
      if (form.mode === "automatic" && ["manualSerialInput"].includes(fieldKey))
        continue;
      if (
        form.finalMode === "manual" &&
        [
          "finalPrefix",
          "finalStart",
          "finalSuffix",
          "finalTotalDevices",
        ].includes(fieldKey)
      )
        continue;
      if (
        form.finalMode === "automatic" &&
        ["manualFinalSerialInput"].includes(fieldKey)
      )
        continue;

      const error = validateField(fieldKey, form[fieldKey]);
      if (error) newErrors[fieldKey] = error;
    }

    setErrors(newErrors);

    const isValid = Object.keys(newErrors).length === 0;
    if (!isValid) {
      const firstError = Object.keys(newErrors)[0] as FieldKey;
      const ref = fieldRefs[firstError];
      if (ref && ref.current) {
        setTimeout(() => {
          ref.current.scrollIntoView({ behavior: "smooth", block: "center" });
          ref.current.focus({ preventScroll: true });
        }, 100);
      }
    }

    return isValid;
  };

  const getSerials = (
    mode: "automatic" | "manual",
    prefix: string,
    start: string,
    suffix: string,
    total: string,
    manualInput: string,
    fieldKey: "serialNumber" | "finalSerialNumber"
  ) => {
    if (mode === "automatic") {
      const s = parseInt(start);
      const t = parseInt(total);
      const padLength = start.length;
      console.log("Generating serials:", { start, total, s, t });
      return Array.from({ length: t }, (_, i) => ({
        [fieldKey]: `${prefix}-${(s + i)
          .toString()
          .padStart(padLength, "0")}-${suffix}`,
        manufacturedOn: null,
      }));
    } else {
      return manualInput
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean)
        .map((s) => ({
          [fieldKey]: s,
          manufacturedOn: null,
        }));
    }
  };

  const getLastSerialFromJob = (
    arr: any[],
    key: "serialNumber" | "finalSerialNumber"
  ): string => {
    const numbers = arr
      .map((s) => {
        const parts = s?.[key]?.split("-");
        return parts?.[1] && /^\d+$/.test(parts[1]) ? parts[1] : null;
      })
      .filter(Boolean) as string[];
    if (!numbers.length) return "";
    const padLength = numbers[0].length;
    const maxNum = Math.max(...numbers.map(Number)) + 1;
    return maxNum.toString().padStart(padLength, "0");
  };

  const handleSubmit = async () => {
    const isValid = validateForm();
    if (!isValid) return;

    const serialNumber = getSerials(
      form.mode,
      form.prefix,
      form.start,
      form.suffix,
      form.totalDevices,
      form.manualSerialInput,
      "serialNumber"
    );

    const finalSerialNumber = getSerials(
      form.finalMode,
      form.finalPrefix,
      form.finalStart,
      form.finalSuffix,
      form.finalTotalDevices,
      form.manualFinalSerialInput,
      "finalSerialNumber"
    );

    try {
      const q = query(
        collection(db, "Jobs"),
        orderBy("jobId", "desc"),
        limit(1)
      );
      const snap = await getDocs(q);
      const latestJobId = snap.empty ? 0 : snap.docs[0].data().jobId;
      const newJobId = latestJobId + 1;

      await addDoc(collection(db, "Jobs"), {
        jobId: newJobId,
        name: form.jobName,
        jobType: form.jobType,
        serialNumber,
        finalSerialNumber,
        noOfDevices: serialNumber.length,
        jobStatus: "DRAFT",
        createdOn: Timestamp.now(),
      });

      setForm(initialForm);
      setFlashMessage({
        type: "success",
        message: "Job created successfully!",
      });
      navigate("/dashboard");
    } catch (err) {
      console.error("Error saving job:", err);
      setFlashMessage({ type: "danger", message: "Failed to create job." });
    }
  };

  useEffect(() => {
    if (jobNameTimer.current) clearTimeout(jobNameTimer.current);

    // ✅ If jobName is empty, clear start/finalStart and return
    if (!form.jobName.trim()) {
      if (form.mode === "automatic") {
        setForm((prev) => ({ ...prev, start: "" }));
        setErrors((prev) => ({ ...prev, start: undefined }));
      }
      if (form.finalMode === "automatic") {
        setForm((prev) => ({ ...prev, finalStart: "" }));
        setErrors((prev) => ({ ...prev, finalStart: undefined }));
      }
      return;
    }

    jobNameTimer.current = setTimeout(async () => {
      try {
        const q = query(
          collection(db, "Jobs"),
          where("name", "==", form.jobName.trim()),
          orderBy("createdOn", "desc"),
          limit(1)
        );
        const snap = await getDocs(q);

        if (!snap.empty) {
          const job = snap.docs[0].data();

          if (form.mode === "automatic" && Array.isArray(job.serialNumber)) {
            const newStart = getLastSerialFromJob(
              job.serialNumber,
              "serialNumber"
            );
            if (newStart) handleChange("start", newStart);
          }

          if (
            form.finalMode === "automatic" &&
            Array.isArray(job.finalSerialNumber)
          ) {
            const newFinalStart = getLastSerialFromJob(
              job.finalSerialNumber,
              "finalSerialNumber"
            );
            if (newFinalStart) handleChange("finalStart", newFinalStart);
          }
        } else {
          // ✅ Job name doesn't exist — clear fields silently
          if (form.mode === "automatic") {
            setForm((prev) => ({ ...prev, start: "" }));
            setErrors((prev) => ({ ...prev, start: undefined }));
          }
          if (form.finalMode === "automatic") {
            setForm((prev) => ({ ...prev, finalStart: "" }));
            setErrors((prev) => ({ ...prev, finalStart: undefined }));
          }
        }
      } catch (err) {
        console.error("❌ Error checking job name:", err);
      }
    }, 500);

    return () => {
      if (jobNameTimer.current) clearTimeout(jobNameTimer.current);
    };
  }, [form.jobName, form.mode, form.finalMode]);

  return (
    <div className="bg-light py-4">
      <div
        className="container d-flex"
        style={{ gap: "20px", flexWrap: "nowrap" }}
      >
        <div className="p-4 bg-white rounded shadow" style={{ flex: 1 }}>
          <h3 className="mb-3">Create New Job</h3>

          {/* Job Name */}
          <div className="mb-3">
            <label className="form-label">Job Name</label>
            <input
              ref={fieldRefs.jobName}
              type="text"
              className={`form-control ${errors.jobName ? "is-invalid" : ""}`}
              placeholder="Enter Job Name"
              value={form.jobName}
              onChange={(e) => handleChange("jobName", e.target.value)}
            />
            {errors.jobName && (
              <div className="invalid-feedback">{errors.jobName}</div>
            )}
          </div>

          {/* Job Type */}
          <div className="mb-2">
            <label className="form-label">Job Type</label>
            <select
              ref={fieldRefs.jobType}
              className={`form-select ${errors.jobType ? "is-invalid" : ""}`}
              value={form.jobType}
              onChange={(e) => handleChange("jobType", e.target.value)}
            >
              <option value="">Select Job Type</option>
              <option value="SM">SM</option>
              <option value="MM">MM</option>
            </select>
            {errors.jobType && (
              <div className="invalid-feedback">{errors.jobType}</div>
            )}
          </div>

          {/* Mode Selection */}
          <hr />
          <div className="mb-3">
            <label className="form-label d-block">
              Serial Numbers Allocation Mode
            </label>
            {["automatic", "manual"].map((m) => (
              <div className="form-check form-check-inline" key={m}>
                <input
                  className="form-check-input"
                  type="radio"
                  checked={form.mode === m}
                  onChange={() => handleChange("mode", m as any)}
                />
                <label className="form-check-label">
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </label>
              </div>
            ))}
          </div>

          {/* Primary Serial Numbers - Automatic or Manual */}
          {form.mode === "automatic" ? (
            <div className="row g-3 mb-3">
              <div className="col-md-3">
                <input
                  ref={fieldRefs.prefix}
                  className={`form-control ${
                    errors.prefix ? "is-invalid" : ""
                  }`}
                  placeholder="Prefix"
                  value={form.prefix}
                  onChange={(e) => handleChange("prefix", e.target.value)}
                />
                {errors.prefix && (
                  <div className="invalid-feedback">{errors.prefix}</div>
                )}
              </div>
              <div className="col-md-3">
                <input
                  ref={fieldRefs.start}
                  className={`form-control ${errors.start ? "is-invalid" : ""}`}
                  placeholder="Start"
                  value={form.start}
                  onChange={(e) => handleChange("start", e.target.value)}
                />
                {errors.start && (
                  <div className="invalid-feedback">{errors.start}</div>
                )}
              </div>
              <div className="col-md-3">
                <input
                  className="form-control"
                  placeholder="End"
                  value={getEnd()}
                  readOnly
                  style={{ backgroundColor: "#f1f1f1" }}
                />
              </div>
              <div className="col-md-3">
                <input
                  ref={fieldRefs.suffix}
                  className={`form-control ${
                    errors.suffix ? "is-invalid" : ""
                  }`}
                  placeholder="Suffix"
                  value={form.suffix}
                  onChange={(e) => handleChange("suffix", e.target.value)}
                />
                {errors.suffix && (
                  <div className="invalid-feedback">{errors.suffix}</div>
                )}
              </div>
            </div>
          ) : (
            <div className="mb-3">
              <label className="form-label">
                Enter Serial Numbers (one per line)
              </label>
              <textarea
                ref={fieldRefs.manualSerialInput}
                className={`form-control ${
                  errors.manualSerialInput ? "is-invalid" : ""
                }`}
                rows={5}
                value={form.manualSerialInput}
                onChange={(e) =>
                  handleChange("manualSerialInput", e.target.value)
                }
              />
              {errors.manualSerialInput && (
                <div className="invalid-feedback">
                  {errors.manualSerialInput}
                </div>
              )}
            </div>
          )}

          {/* Primary Total Devices */}
          <div className="mb-3">
            <label className="form-label">Total No. of Devices</label>
            <input
              ref={fieldRefs.totalDevices}
              type="number"
              className={`form-control ${
                errors.totalDevices ? "is-invalid" : ""
              }`}
              value={
                form.mode === "automatic"
                  ? form.totalDevices
                  : totalManualDevices
              }
              onChange={(e) =>
                form.mode === "automatic" &&
                handleChange("totalDevices", e.target.value)
              }
              readOnly={form.mode === "manual"}
              style={
                form.mode === "manual" ? { backgroundColor: "#f1f1f1" } : {}
              }
            />
            {errors.totalDevices && (
              <div className="invalid-feedback">{errors.totalDevices}</div>
            )}
          </div>

          {/* Final Serial Numbers */}
          <hr />
          <div className="mb-3">
            <label className="form-label d-block">Final Serial Numbers</label>
            {["automatic", "manual"].map((m) => (
              <div className="form-check form-check-inline" key={m}>
                <input
                  className="form-check-input"
                  type="radio"
                  checked={form.finalMode === m}
                  onChange={() => handleChange("finalMode", m as any)}
                />
                <label className="form-check-label">
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </label>
              </div>
            ))}
          </div>

          {form.finalMode === "automatic" ? (
            <div className="row g-3 mb-3">
              <div className="col-md-3">
                <input
                  ref={fieldRefs.finalPrefix}
                  className={`form-control ${
                    errors.finalPrefix ? "is-invalid" : ""
                  }`}
                  placeholder="Prefix"
                  value={form.finalPrefix}
                  onChange={(e) => handleChange("finalPrefix", e.target.value)}
                />
                {errors.finalPrefix && (
                  <div className="invalid-feedback">{errors.finalPrefix}</div>
                )}
              </div>
              <div className="col-md-3">
                <input
                  ref={fieldRefs.finalStart}
                  className={`form-control ${
                    errors.finalStart ? "is-invalid" : ""
                  }`}
                  placeholder="Start"
                  value={form.finalStart}
                  onChange={(e) => handleChange("finalStart", e.target.value)}
                />
                {errors.finalStart && (
                  <div className="invalid-feedback">{errors.finalStart}</div>
                )}
              </div>
              <div className="col-md-3">
                <input
                  className="form-control"
                  placeholder="End"
                  value={getFinalEnd()}
                  readOnly
                  style={{ backgroundColor: "#f1f1f1" }}
                />
              </div>
              <div className="col-md-3">
                <input
                  ref={fieldRefs.finalSuffix}
                  className={`form-control ${
                    errors.finalSuffix ? "is-invalid" : ""
                  }`}
                  placeholder="Suffix"
                  value={form.finalSuffix}
                  onChange={(e) => handleChange("finalSuffix", e.target.value)}
                />
                {errors.finalSuffix && (
                  <div className="invalid-feedback">{errors.finalSuffix}</div>
                )}
              </div>
            </div>
          ) : (
            <div className="mb-3">
              <label className="form-label">
                Enter Serial Numbers (one per line)
              </label>
              <textarea
                ref={fieldRefs.manualFinalSerialInput}
                className={`form-control ${
                  errors.manualFinalSerialInput ? "is-invalid" : ""
                }`}
                rows={5}
                value={form.manualFinalSerialInput}
                onChange={(e) =>
                  handleChange("manualFinalSerialInput", e.target.value)
                }
              />
              {errors.manualFinalSerialInput && (
                <div className="invalid-feedback">
                  {errors.manualFinalSerialInput}
                </div>
              )}
            </div>
          )}

          {/* Final Total Devices */}
          <div className="mb-3">
            <label className="form-label">Total No. of Devices</label>
            <input
              ref={fieldRefs.finalTotalDevices}
              type="number"
              className={`form-control ${
                errors.finalTotalDevices ? "is-invalid" : ""
              }`}
              value={
                form.finalMode === "automatic"
                  ? form.finalTotalDevices
                  : totalManualFinalDevices
              }
              onChange={(e) =>
                form.finalMode === "automatic" &&
                handleChange("finalTotalDevices", e.target.value)
              }
              readOnly={form.finalMode === "manual"}
              style={
                form.finalMode === "manual"
                  ? { backgroundColor: "#f1f1f1" }
                  : {}
              }
            />
            {errors.finalTotalDevices && (
              <div className="invalid-feedback">{errors.finalTotalDevices}</div>
            )}
          </div>

          {/* Submit / Back Buttons */}
          <div className="d-flex gap-3">
            <button className="btn btn-outline-primary" onClick={handleSubmit}>
              Create Job
            </button>
            <button
              className="btn btn-outline-secondary"
              onClick={() => navigate(-1)}
            >
              Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateJobPage;
