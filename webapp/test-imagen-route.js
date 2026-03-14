async function testRoute() {
  console.log("Testing POST to http://localhost:3000/api/search...");
  const payload = {
    query: "Spiega il concetto giuridico di servitù di passaggio",
    sourceFilter: null,
    history: []
  };

  try {
    const res = await fetch("http://localhost:3000/api/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
        console.error("API Error:", res.status, res.statusText);
        return;
    }

    const data = await res.json();
    console.log("Response Text Preview:", data.response?.substring(0, 100) + "...");
    console.log("Illustration Present:", data.legal_illustration ? "YES (Base64)" : "NO");
    console.log("Tenth Man Present:", data.contra_analysis ? "YES" : "NO");
    
  } catch (err) {
    console.error("Fetch failed:", err);
  }
}

testRoute();
