export default async function handler(req, res) {

const query = req.query.q;

if (!query) {
return res.status(200).json({ courses: [] });
}

const url =
`https://tee-box-bets.vercel.app/api/search?q=${encodeURIComponent(query)}`;

const response = await fetch(url, {
headers: {
"X-API-Key": process.env.GOLF_API_KEY
}
});

const data = await response.json();

res.status(200).json(data);
}