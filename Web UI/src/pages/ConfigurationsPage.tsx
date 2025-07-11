import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  DocumentData,
  QueryDocumentSnapshot,
  Timestamp,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { Button } from "react-bootstrap";
import { db } from "../firebase";
import "../styles/ConfigurationsPage.css";

interface Configuration {
  id: string;
  name?: string;
  deviceType?: string;
  hardwareVersion?: string;
  createdOn?: Timestamp;
  [key: string]: any; // For any other dynamic fields
}

const ConfigurationsPage: React.FC = () => {
  const [configs, setConfigs] = useState<Configuration[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchConfigs = async () => {
      try {
        const snapshot = await getDocs(collection(db, "Configurations"));
        const data: Configuration[] = snapshot.docs.map(
          (docSnap: QueryDocumentSnapshot<DocumentData>) => {
            return { id: docSnap.id, ...docSnap.data() };
          }
        );
        setConfigs(data);
      } catch (error) {
        console.error("Error fetching configurations:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchConfigs();
  }, []);

  const formatDate = (timestamp?: Timestamp) => {
    return timestamp?.toDate().toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "medium",
    });
  };

  return (
    <div className="container py-4" style={{ maxWidth: "900px" }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3>Configurations</h3>
        <Button
          variant="outline-primary"
          onClick={() => navigate("/create-configuration")}
        >
          Create New Configuration
        </Button>
      </div>

      <div className="table-responsive">
        <table className="table table-bordered table-hover align-middle text-center modern-table">
          <thead className="table-light">
            <tr>
              <th className="px-3">Name</th>
              <th className="px-3">Device Type</th>
              <th className="px-3">Created On</th>
              <th className="px-3">Info</th>
              <th className="px-3">Edit</th> {/* New Edit Column */}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="text-center py-3">
                  <div className="spinner-border text-secondary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </td>
              </tr>
            ) : configs.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-3">
                  No configurations found.
                </td>
              </tr>
            ) : (
              configs.map((config) => (
                <tr key={config.id}>
                  <td className="px-3">{config.name || "(Unnamed)"}</td>
                  <td className="px-3">{config.deviceType || "-"}</td>
                  <td className="px-3">
                    {formatDate(config.createdOn) || "-"}
                  </td>
                  <td className="px-3">
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() =>
                        navigate(`/configurations/${config.id}/info`)
                      }
                    >
                      View
                    </Button>
                  </td>
                  <td className="px-3">
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() =>
                        navigate(`/configurations/${config.id}/edit`)
                      }
                    >
                      Edit
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-3">
        <Button variant="outline-secondary" onClick={() => navigate(-1)}>
          Back
        </Button>
      </div>
    </div>
  );
};

export default ConfigurationsPage;
