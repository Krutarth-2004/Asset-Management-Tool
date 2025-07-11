import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import "../styles/DashboardPage.css";

const JobInfoPage: React.FC = () => {
  const { id: jobid } = useParams();
  const navigate = useNavigate();
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJob = async () => {
      if (!jobid) return;

      try {
        const jobRef = doc(db, "Jobs", jobid);
        const jobSnap = await getDoc(jobRef);

        if (!jobSnap.exists()) {
          setLoading(false);
          return;
        }

        const job = jobSnap.data();

        // Fetch Configuration data
        let configData: any = {};
        let configId: string = "";

        if (job.Configuration) {
          const configSnap = await getDoc(job.Configuration);
          configId = job.Configuration.id;

          if (configSnap.exists()) {
            configData = configSnap.data();
            if (configData.CreatedOn?.toDate) {
              configData.CreatedOn =
                configData.CreatedOn.toDate().toLocaleString("en-IN", {
                  dateStyle: "medium",
                  timeStyle: "medium",
                });
            }
          }
        }

        const serialList = job.SerialNumber || [];
        const deviceRows = serialList.map((device: any, index: number) => {
          const manufacturedOnFormatted = device.ManufacturedOn?.toDate
            ? device.ManufacturedOn.toDate().toLocaleString("en-IN", {
                dateStyle: "medium",
                timeStyle: "medium",
              })
            : "-";

          return {
            id: `${jobid}-${index}`,
            jobId: jobid,
            serial: device.Serial ?? "-",
            manufacturedOn: manufacturedOnFormatted,
            qaBy: device.QABY ?? "-",
            testLatLong: device.TestLatLong ?? "-",
            configuration: configData,
            configId: configId,
          };
        });

        setDevices(deviceRows);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching job:", error);
        setLoading(false);
      }
    };

    fetchJob();
  }, [jobid]);

  return (
    <div className="container mt-4">
      <h3 className="mb-3">Job Details</h3>

      <div className="table-responsive">
        <table className="table table-bordered table-hover align-middle text-center modern-table">
          <thead className="table-light">
            <tr>
              <th className="px-3">Job ID</th>
              <th className="px-3">Serial Number</th>
              <th className="px-3">Manufactured On</th>
              <th className="px-3">QA By</th>
              <th className="px-3">Test Lat Long</th>
              <th className="px-3">Configuration</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-4">
                  <div className="d-flex justify-content-center align-items-center gap-2">
                    <div
                      className="spinner-border text-secondary"
                      role="status"
                      style={{ width: "1.5rem", height: "1.5rem" }}
                    >
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                </td>
              </tr>
            ) : devices.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-4">
                  No devices found for this job.
                </td>
              </tr>
            ) : (
              devices.map((device) => (
                <tr key={device.id}>
                  <td className="px-3">{device.jobId}</td>
                  <td className="px-3">{device.serial}</td>
                  <td className="px-3">{device.manufacturedOn}</td>
                  <td className="px-3">{device.qaBy}</td>
                  <td className="px-3">{device.testLatLong}</td>
                  <td
                    className="px-3"
                    style={{ position: "relative", minWidth: "280px" }}
                  >
                    <pre
                      className="mb-0 text-start"
                      style={{
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                        maxWidth: "100%",
                        fontSize: "0.85rem",
                        paddingRight: "4rem",
                      }}
                    >
                      {JSON.stringify(
                        {
                          Name: device.configuration?.Name,
                          autotestLowerRange:
                            device.configuration?.autotestLowerRange,
                          autotestUpperRange:
                            device.configuration?.autotestUpperRange,
                          CreatedOn: device.configuration?.CreatedOn,
                        },
                        null,
                        2
                      )}
                    </pre>
                    <button
                      className="btn btn-sm btn-link position-absolute bottom-0 end-0 mb-1 me-2 p-0"
                      style={{ fontSize: "0.85rem" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/configurations/${device.configId}/info`);
                      }}
                    >
                      more...
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="mt-3">
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

export default JobInfoPage;
