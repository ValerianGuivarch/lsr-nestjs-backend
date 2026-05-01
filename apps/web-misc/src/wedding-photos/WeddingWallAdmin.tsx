import React, { useEffect, useState } from "react";
import styled from "styled-components";
import axios from "axios";
import config from "../config/config";

const API_URL = `/apil7r/v1/wedding-photos`;

type PhotoItem = {
  id: string;
  url: string;
  thumbUrl: string;
};

function normalizeUrl(u: string): string {
  if (!u) return u;
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  if (u.startsWith("/")) return `${config.BASE_URL}${u}`;
  return u;
}

export default function WeddingWallAdmin() {
  const [items, setItems] = useState<PhotoItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/latest`, {
        params: { limit: 1000 },
      });

      const items = res.data.items ?? [];

      setItems(
        items.map((it: PhotoItem) => ({
          ...it,
          url: normalizeUrl(it.url),
          thumbUrl: normalizeUrl(it.thumbUrl),
        })),
      );
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const remove = async (id: string) => {
    if (!window.confirm("Supprimer cette photo ?")) return;

    try {
      await axios.delete(`${API_URL}/item`, {
        params: { id },
      });

      setItems((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      alert("Erreur suppression");
    }
  };

  return (
    <Page>
      <h1>Admin photos</h1>

      {loading && <p>Chargement…</p>}

      <Grid>
        {items.map((p) => (
          <Card key={p.id}>
            <Img src={p.thumbUrl || p.url} />

            <DeleteBtn onClick={() => remove(p.id)}>Supprimer</DeleteBtn>
          </Card>
        ))}
      </Grid>
    </Page>
  );
}

const Page = styled.div`
  padding: 20px;
  background: #111;
  min-height: 100vh;
  color: white;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
`;

const Card = styled.div`
  position: relative;
`;

const Img = styled.img`
  width: 100%;
  height: 140px;
  object-fit: cover;
  border-radius: 10px;
`;

const DeleteBtn = styled.button`
  position: absolute;
  bottom: 6px;
  left: 6px;
  right: 6px;
  padding: 6px;
  border: none;
  border-radius: 8px;
  background: rgba(255, 0, 0, 0.7);
  color: white;
  font-weight: bold;
`;
