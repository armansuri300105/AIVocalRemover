import axios from "axios"

const apiBaseUrl = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : "http://localhost:5000/api"

const api = axios.create({
  baseURL: apiBaseUrl,
})

export const ytProcess = (data) => api.post("/yt/process-youtube", data)

export const fetchMetaData = (url) =>
  api.get(`/yt/youtube-metadata?url=${encodeURIComponent(url)}`)

export const getJobStatus = ({ jobId, type }) =>
  api.get(`/job/jobstatus?id=${jobId}&type=${type}`)
