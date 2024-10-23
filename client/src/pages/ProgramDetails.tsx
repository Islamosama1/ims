import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

interface Program {
  id: string;
  name: string;
  description: string;
  // Add other fields based on your data structure
}

const ProgramDetails: React.FC = () => {
  const { programId } = useParams<{ programId: string }>();
  const [program, setProgram] = useState<Program | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProgram = async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/api/v1/programs/${programId}`,
        );
        if (!response.ok) {
          throw new Error('Failed to fetch program data');
        }
        const data = await response.json();
        setProgram(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProgram();
  }, [programId]);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p>Error: {error}</p>;
  }

  if (!program) {
    return <p>No program found</p>;
  }

  return (
    <div>
      <h1>{program.name}</h1>
      <p>{program.description}</p>
      {/* Render more fields as necessary */}
    </div>
  );
};

export default ProgramDetails;
