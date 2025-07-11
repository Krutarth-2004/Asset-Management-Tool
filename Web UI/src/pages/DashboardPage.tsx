import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  Timestamp,
  DocumentData,
} from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";
import { Button, Spinner } from "react-bootstrap";
import "../styles/DashboardPage.css";

interface Job {
  id: string;
  jobId: string;
  name: string;
  jobType: string;
  serialNumber: { serialNumber: string; manufacturedOn: Timestamp | null }[];
  noOfDevices: number;
  jobStatus: string;
  createdOn: Timestamp;
}

const DashboardPage: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const snapshot = await getDocs(collection(db, "Jobs"));
        const jobData: Job[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          console.log("Job Data:", data);
          return {
            id: docSnap.id,
            name: data.name,
            jobId: data.jobId,
            jobType: data.jobType,
            serialNumber: data.serialNumber || [],
            noOfDevices: data.noOfDevices,
            jobStatus: data.jobStatus,
            createdOn: data.createdOn,
          };
        });
        setJobs(jobData.sort((a, b) => Number(a.jobId) - Number(b.jobId)));
      } catch (error) {
        console.error("Failed to fetch jobs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  const getProgress = (job: Job): number => {
    const total = job.noOfDevices;
    const manufactured = job.serialNumber.filter(
      (s) => s.manufacturedOn !== null
    ).length;
    return total === 0 ? 0 : Math.round((manufactured / total) * 100);
  };

  const getProgressColor = (percent: number): string => {
    if (percent <= 33) return "bg-danger";
    if (percent <= 66) return "bg-warning";
    return "bg-success";
  };

  const formatDate = (timestamp: Timestamp) =>
    timestamp.toDate().toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "medium",
    });

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3>Jobs Dashboard</h3>
        <Button
          variant="outline-primary"
          onClick={() => navigate("/create-job")}
        >
          Create New Job
        </Button>
      </div>

      {loading ? (
        <div className="text-center">
          <Spinner animation="border" variant="secondary" />
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-bordered table-hover align-middle text-center modern-table">
            <thead className="table-light">
              <tr>
                <th className="px-3">JobId</th>
                <th className="px-3">Job Name</th>
                <th className="px-3">Job Type</th>
                <th className="px-3">Devices</th>
                <th className="px-3">Progress</th>
                <th className="px-3">Created On</th>
                <th className="px-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {jobs.length === 0 ? (
                <tr>
                  <td colSpan={6}>No jobs found.</td>
                </tr>
              ) : (
                jobs.map((job) => {
                  const progress = getProgress(job);
                  const progressBarClass = getProgressColor(progress);

                  return (
                    <tr
                      key={job.id}
                      style={{ cursor: "pointer" }}
                      onClick={() => navigate(`/jobs/${job.id}/info`)}
                    >
                      <td className="px-3">{job.jobId}</td>
                      <td className="px-3">{job.name}</td>
                      <td className="px-3">{job.jobType}</td>
                      <td className="px-3">{job.noOfDevices}</td>
                      <td className="px-3">
                        <div className="d-flex align-items-center justify-content-center gap-2">
                          <div
                            className="progress"
                            style={{
                              height: "16px",
                              width: "150px",
                              backgroundColor: "#e9ecef",
                              borderRadius: "8px",
                            }}
                          >
                            <div
                              className={`progress-bar ${progressBarClass}`}
                              role="progressbar"
                              style={{
                                width: `${progress}%`,
                                backgroundColor:
                                  progress === 0 ? "#e9ecef" : undefined,
                              }}
                              aria-valuenow={progress}
                              aria-valuemin={0}
                              aria-valuemax={100}
                            ></div>
                          </div>
                          <span
                            className="fw-semibold"
                            style={{ minWidth: "35px" }}
                          >
                            {progress}%
                          </span>
                        </div>
                      </td>
                      <td className="px-3">{formatDate(job.createdOn)}</td>
                      <td className="px-3">{job.jobStatus}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
