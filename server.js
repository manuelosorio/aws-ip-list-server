import express from "express";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const AWS_IP_RANGES_URL = "https://ip-ranges.amazonaws.com/ip-ranges.json";

let awsIpRanges = [];

// Fetch AWS IP ranges at startup and periodically refresh
async function fetchAwsIpRanges() {
  try {
    const response = await fetch(AWS_IP_RANGES_URL);
    const data = await response.json();
    awsIpRanges = data.prefixes.concat(data.ipv6_prefixes);
    console.log(`Fetched ${awsIpRanges.length} AWS IP ranges.`);
  } catch (error) {
    console.error("Failed to fetch AWS IP ranges:", error);
  }
}

// Refresh IP data every hour
setInterval(fetchAwsIpRanges, 60 * 60 * 1000);
fetchAwsIpRanges();

app.use(express.static(join(__dirname, 'public')));

// Endpoint to get IP ranges with optional filters
app.get("/aws-ips", (req, res) => {
  const { region, type } = req.query;
  
  let filteredIps = awsIpRanges;
  
  if (region) {
    filteredIps = filteredIps.filter(ip => ip.region === region);
  }
  
  if (type) {
    if (type === "ipv4") {
      filteredIps = filteredIps.filter(ip => ip.ip_prefix);
    } else if (type === "ipv6") {
      filteredIps = filteredIps.filter(ip => ip.ipv6_prefix);
    } else {
      return res.status(400).json({ error: "Invalid type filter. Use 'ipv4' or 'ipv6'." });
    }
  }

  res.json(filteredIps.map(ip => ip.ip_prefix || ip.ipv6_prefix));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
