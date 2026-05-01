import { useRef, useState, useEffect } from "react";
import "./UploadUI.css";

function UploadUI({ projectName, userId }) {
    const fileRef = useRef();
    const dragCounter = useRef(0);

    const [file, setFile] = useState(null);
    const [dragging, setDragging] = useState(false);
    const [uploaded, setUploaded] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [fileId, setFileId] = useState(null);

    const [error, setError] = useState("");
    const [copied, setCopied] = useState(false);

    // Time limit in minutes (max 15)
    const [timeLimit, setTimeLimit] = useState(5);
    // Download limit (no hard max, but reasonable)
    const [downloadLimit, setDownloadLimit] = useState(3);

    const [generatedLink, setGeneratedLink] = useState("");
    const [shareToken, setShareToken] = useState("");

    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    const MAX_TIME = 15; // Max 15 minutes

    // Time limit handlers with min/max constraints
    const handleTimeIncrease = () => {
        if (timeLimit < MAX_TIME) {
            setTimeLimit(timeLimit + 1);
        }
    };

    const handleTimeDecrease = () => {
        if (timeLimit > 1) {
            setTimeLimit(timeLimit - 1);
        }
    };

    const handleTimeChange = (e) => {
        let value = parseInt(e.target.value);
        if (isNaN(value)) value = 1;
        value = Math.min(MAX_TIME, Math.max(1, value));
        setTimeLimit(value);
    };

    // Download limit handlers
    const handleDownloadIncrease = () => {
        setDownloadLimit(downloadLimit + 1);
    };

    const handleDownloadDecrease = () => {
        if (downloadLimit > 1) {
            setDownloadLimit(downloadLimit - 1);
        }
    };

    const handleDownloadChange = (e) => {
        let value = parseInt(e.target.value);
        if (isNaN(value)) value = 1;
        if (value < 1) value = 1;
        setDownloadLimit(value);
    };

    // VALIDATION
    const validateFile = (file) => {
        if (file.size > MAX_SIZE) {
            setError("File must be less than 10MB");
            return false;
        }
        setError("");
        return true;
    };

    // FILE SELECT
    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && validateFile(selectedFile)) {
            setFile(selectedFile);
            setError("");
        }
    };

    // DRAG HANDLERS
    const handleDragEnter = (e) => {
        e.preventDefault();
        dragCounter.current++;
        setDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        dragCounter.current--;
        if (dragCounter.current === 0) setDragging(false);
    };

    const handleDragOver = (e) => e.preventDefault();

    const handleDrop = (e) => {
        e.preventDefault();
        setDragging(false);
        dragCounter.current = 0;

        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile && validateFile(droppedFile)) {
            setFile(droppedFile);
            setError("");
        }
    };

    // REMOVE FILE (Complete reset)
    const handleRemoveFile = () => {
        setFile(null);
        setUploaded(false);
        setFileId(null);
        setGeneratedLink("");
        setError("");
        setShareToken("");
        if (fileRef.current) {
            fileRef.current.value = "";
        }
    };

    // UPLOAD FILE TO BACKEND
    const handleUpload = async () => {
        if (!userId) {
            setError("User not authenticated. Please login again.");
            return;
        }

        setUploading(true);
        setError("");

        const formData = new FormData();
        formData.append("file", file);
        formData.append("userId", userId);

        try {
            const response = await fetch("http://localhost:8080/upload", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || "Upload failed");
            }

            const fileIdResponse = await response.text();
            const cleanFileId = fileIdResponse.replace(/^"|"$/g, '');
            console.log("Upload success - File ID:", cleanFileId);

            setFileId(cleanFileId);
            setUploaded(true);

        } catch (error) {
            console.error("Upload error:", error);
            setError("Upload failed: " + error.message);
        } finally {
            setUploading(false);
        }
    };

    // GENERATE SHARE LINK WITH LIMITS
    const handleGenerateLink = async () => {
        if (generatedLink) return;
        if (!fileId) {
            setError("No file found. Please upload first.");
            return;
        }
        if (!userId) {
            setError("User not authenticated.");
            return;
        }

        setError("");

        try {
            const formData = new FormData();
            formData.append("fileId", fileId);
            formData.append("userId", userId);
            formData.append("minutes", timeLimit);
            formData.append("downloadLimit", downloadLimit);

            console.log("Sending share request:", { fileId, userId, timeLimit, downloadLimit });

            const response = await fetch("http://localhost:8080/share", {
                method: "POST",
                body: formData,
            });

            const responseText = await response.text();
            console.log("Share response:", responseText);

            if (!response.ok) {
                // Handle specific error cases
                if (response.status === 400) {
                    throw new Error("Invalid request. Please check your settings.");
                } else if (response.status === 401) {
                    throw new Error("Authentication failed. Please login again.");
                } else if (response.status === 403) {
                    throw new Error("You don't have permission to share this file.");
                } else if (response.status === 404) {
                    throw new Error("File not found. Please upload again.");
                } else {
                    throw new Error(responseText || "Failed to generate link");
                }
            }

            // Extract token from response (assuming response is like "/download/token123")
            const token = responseText.replace("/download/", "").trim();
            setShareToken(token);
            const fullDownloadUrl = `http://localhost:8080${responseText}`;
            setGeneratedLink(fullDownloadUrl);

        } catch (error) {
            console.error("Generate link error:", error);
            setError("Failed to generate link: " + error.message);
        }
    };

    // COPY LINK TO CLIPBOARD
    const handleCopy = () => {
        navigator.clipboard.writeText(generatedLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    // RESET EVERYTHING
    const handleReset = () => {
        setFile(null);
        setUploaded(false);
        setFileId(null);
        setGeneratedLink("");
        setError("");
        setShareToken("");
        if (fileRef.current) {
            fileRef.current.value = "";
        }
    };

    // TEST DOWNLOAD LINK WITH ERROR HANDLING
    const testDownloadLink = async () => {
        if (!shareToken) return;

        try {
            const response = await fetch(`http://localhost:8080/download/${shareToken}`, {
                method: 'HEAD', // Just check headers, don't download the file
            });

            if (response.status === 410) {
                setError("❌ This link has expired or reached its download limit.");
                return false;
            } else if (response.status === 404) {
                setError("❌ Link not found. It may have been removed.");
                return false;
            } else if (!response.ok) {
                setError(`❌ Link error: ${response.statusText}`);
                return false;
            }
            return true;
        } catch (error) {
            console.error("Link check error:", error);
            return false;
        }
    };

    return (
        <div className="container">
            <h2 className="project-name">{projectName}</h2>
            <h1>Upload Your File</h1>

            {error && (
                <div className="alert" style={{
                    color: error.includes("expired") || error.includes("limit") ? '#856404' : '#721c24',
                    backgroundColor: error.includes("expired") || error.includes("limit") ? '#fff3cd' : '#f8d7da',
                    border: error.includes("expired") || error.includes("limit") ? '1px solid #ffeeba' : '1px solid #f5c6cb',
                    padding: '12px',
                    borderRadius: '8px',
                    marginBottom: '10px'
                }}>
                    {error.includes("expired") || error.includes("limit") ? "⏰" : "⚠️"} {error}
                </div>
            )}

            {/* STEP 1: Select File */}
            {!file && (
                <div
                    className={`card drop-zone ${dragging ? "dragging" : ""}`}
                    tabIndex={0}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") fileRef.current.click();
                    }}
                    onClick={() => fileRef.current.click()}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                >
                    {dragging && <div className="overlay">Drop file here</div>}

                    <p>Drag & drop OR click to select file</p>
                    <button type="button">Select File</button>

                    <input
                        type="file"
                        ref={fileRef}
                        onChange={handleFileChange}
                        hidden
                    />
                </div>
            )}

            {/* STEP 2: File Ready for Upload with Delete Button */}
            {file && !uploaded && (
                <div className="card">
                    <div className="file-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <h3 style={{ margin: 0 }}>File Ready</h3>
                        <button
                            onClick={handleRemoveFile}
                            style={{
                                background: 'none',
                                border: 'none',
                                fontSize: '24px',
                                cursor: 'pointer',
                                padding: '5px 10px',
                                borderRadius: '8px',
                                transition: 'all 0.2s',
                                color: '#dc3545'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.background = '#fee';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.background = 'none';
                            }}
                            title="Remove file"
                        >
                            🗑️
                        </button>
                    </div>

                    <div className="file-details">
                        <div className="file-row">
                            <span className="label">File Name:</span>
                            <span className="value">{file.name}</span>
                        </div>

                        <div className="file-row">
                            <span className="label">Size:</span>
                            <span className="value">
                                {(file.size / 1024).toFixed(2)} KB
                            </span>
                        </div>

                        <div className="file-row">
                            <span className="label">Type:</span>
                            <span className="value">
                                {file.type || 'Unknown'}
                            </span>
                        </div>
                    </div>

                    <button onClick={handleUpload} disabled={uploading}>
                        {uploading ? "Uploading..." : "Upload File"}
                    </button>
                </div>
            )}

            {/* STEP 3: Configure Share Settings & Generate Link */}
            {uploaded && !generatedLink && (
                <div className="card">
                    <div className="file-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <h3 style={{ margin: 0 }}>Upload Successful ✅</h3>
                        <button
                            onClick={handleReset}
                            style={{
                                background: 'none',
                                border: 'none',
                                fontSize: '24px',
                                cursor: 'pointer',
                                padding: '5px 10px',
                                borderRadius: '8px',
                                transition: 'all 0.2s',
                                color: '#dc3545'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.background = '#fee';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.background = 'none';
                            }}
                            title="Reset and upload new file"
                        >
                            🗑️
                        </button>
                    </div>

                    <p style={{ fontSize: '12px', color: '#666', marginBottom: '20px' }}>
                        File ID: {fileId}
                    </p>

                    {/* Time Limit Control with Spinner */}
                    <div className="limit-box" style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
                            ⏱ Time Limit (minutes):
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                                display: 'flex',
                                border: '1px solid #ddd',
                                borderRadius: '8px',
                                overflow: 'hidden'
                            }}>
                                <button
                                    type="button"
                                    onClick={handleTimeDecrease}
                                    style={{
                                        width: '40px',
                                        height: '40px',
                                        margin: '0',
                                        borderRadius: '0',
                                        background: '#f0f0f0',
                                        color: '#333',
                                        fontSize: '20px',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    −
                                </button>
                                <input
                                    type="number"
                                    value={timeLimit}
                                    onChange={handleTimeChange}
                                    min="1"
                                    max={MAX_TIME}
                                    style={{
                                        width: '80px',
                                        height: '40px',
                                        textAlign: 'center',
                                        border: 'none',
                                        fontSize: '16px',
                                        fontWeight: 'bold',
                                        padding: '0'
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={handleTimeIncrease}
                                    style={{
                                        width: '40px',
                                        height: '40px',
                                        margin: '0',
                                        borderRadius: '0',
                                        background: '#f0f0f0',
                                        color: '#333',
                                        fontSize: '20px',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    +
                                </button>
                            </div>
                            <span style={{ color: '#666' }}>minutes (max {MAX_TIME} mins)</span>
                        </div>
                        {timeLimit === MAX_TIME && (
                            <p style={{ fontSize: '12px', color: '#ff9800', marginTop: '5px' }}>
                                ⚠️ Maximum time limit is {MAX_TIME} minutes
                            </p>
                        )}
                    </div>

                    {/* Download Limit Control with Spinner */}
                    <div className="limit-box" style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
                            ⬇ Download Limit:
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                                display: 'flex',
                                border: '1px solid #ddd',
                                borderRadius: '8px',
                                overflow: 'hidden'
                            }}>
                                <button
                                    type="button"
                                    onClick={handleDownloadDecrease}
                                    style={{
                                        width: '40px',
                                        height: '40px',
                                        margin: '0',
                                        borderRadius: '0',
                                        background: '#f0f0f0',
                                        color: '#333',
                                        fontSize: '20px',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    −
                                </button>
                                <input
                                    type="number"
                                    value={downloadLimit}
                                    onChange={handleDownloadChange}
                                    min="1"
                                    style={{
                                        width: '80px',
                                        height: '40px',
                                        textAlign: 'center',
                                        border: 'none',
                                        fontSize: '16px',
                                        fontWeight: 'bold',
                                        padding: '0'
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={handleDownloadIncrease}
                                    style={{
                                        width: '40px',
                                        height: '40px',
                                        margin: '0',
                                        borderRadius: '0',
                                        background: '#f0f0f0',
                                        color: '#333',
                                        fontSize: '20px',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    +
                                </button>
                            </div>
                            <span style={{ color: '#666' }}>downloads</span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={handleGenerateLink}>
                            Generate Share Link
                        </button>

                        <button
                            onClick={handleReset}
                            style={{ background: '#666' }}
                        >
                            Upload Another File
                        </button>
                    </div>
                </div>
            )}

            {/* STEP 4: Share Link Generated */}
            {generatedLink && (
                <div className="card">
                    <div className="file-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <h3 style={{ margin: 0 }}>Share Your File 🔗</h3>
                        <button
                            onClick={handleReset}
                            style={{
                                background: 'none',
                                border: 'none',
                                fontSize: '24px',
                                cursor: 'pointer',
                                padding: '5px 10px',
                                borderRadius: '8px',
                                transition: 'all 0.2s',
                                color: '#dc3545'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.background = '#fee';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.background = 'none';
                            }}
                            title="Reset and upload new file"
                        >
                            🗑️
                        </button>
                    </div>

                    <div className="info-box" style={{
                        background: '#f0f7ff',
                        padding: '10px',
                        borderRadius: '10px',
                        marginBottom: '15px',
                        fontSize: '14px'
                    }}>
                        <p>⏱ Link expires in: <strong>{timeLimit} minute{timeLimit !== 1 ? 's' : ''}</strong></p>
                        <p>⬇ Downloads allowed: <strong>{downloadLimit}</strong></p>
                    </div>

                    <div className="link-box">
                        <div className="copy-box" style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                            <input
                                type="text"
                                value={generatedLink}
                                readOnly
                                style={{
                                    flex: 1,
                                    padding: '10px',
                                    borderRadius: '10px',
                                    border: '1px solid #ddd',
                                    fontSize: '12px'
                                }}
                            />
                            <button onClick={handleCopy}>
                                {copied ? "Copied!" : "Copy Link"}
                            </button>
                        </div>

                        <p style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
                            Share this link with anyone. The link will expire after {timeLimit} minute{timeLimit !== 1 ? 's' : ''} or after {downloadLimit} download{downloadLimit !== 1 ? 's' : ''}.
                        </p>

                        <button
                            onClick={testDownloadLink}
                            style={{ marginRight: '10px', background: '#6c757d' }}
                        >
                            Test Link Status
                        </button>

                        <button
                            onClick={handleReset}
                            style={{ background: '#4a90e2' }}
                        >
                            Upload Another File
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}


export default UploadUI;
