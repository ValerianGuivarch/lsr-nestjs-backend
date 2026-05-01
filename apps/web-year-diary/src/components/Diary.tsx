import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import Modal from "react-modal";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import axios from "axios";
import {
  FaCalendar,
  FaChevronLeft,
  FaChevronRight,
  FaDAndD,
} from "react-icons/fa";
import { MdEdit, MdSave } from "react-icons/md";
import { GiReturnArrow } from "react-icons/gi";

const API_URL = "https://l7r.fr/api/v1/diaries";
const CHARACTER_LIMIT = 300;

interface Entry {
  id?: string;
  year: number;
  month: number;
  day: number;
  text: string;
}

interface TileContentProps {
  date: Date;
  view: string;
}

const Diary: React.FC = () => {
  const [date, setDate] = useState(new Date());
  const [entries, setEntries] = useState<{ [key: number]: Entry }>({});
  const [missingDates, setMissingDates] = useState<
    { day: number; month: number; year: number }[]
  >([]);
  const [editingYear, setEditingYear] = useState<number | null>(null);
  const [newText, setNewText] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [years, setYears] = useState<number[]>([]);

  useEffect(() => {
    fetchEntries();
    fetchMissingDates();
  }, [date]);

  const fetchEntries = async () => {
    try {
      const response = await axios.get(
        `${API_URL}?day=${date.getDate()}&month=${date.getMonth() + 1}`,
      );
      const data = response.data;
      const entriesByYear = data.reduce(
        (acc: { [key: number]: Entry }, entry: Entry) => {
          acc[entry.year] = entry;
          return acc;
        },
        {},
      );
      setEntries(entriesByYear);

      const currentYear = date.getFullYear();
      const updatedYears = Array.from(
        { length: currentYear - 2020 + 1 },
        (_, i) => currentYear - i,
      ).filter((year) => year <= currentYear);
      setYears(updatedYears);
    } catch (error) {
      console.error("Error fetching entries", error);
    }
  };

  const fetchMissingDates = async () => {
    try {
      const response = await axios.get(`${API_URL}/missing`);
      setMissingDates(response.data);
    } catch (error) {
      console.error("Error fetching missing dates", error);
    }
  };

  const handlePrevDay = () => {
    setDate(new Date(date.setDate(date.getDate() - 1)));
  };

  const handleNextDay = () => {
    const tomorrow = new Date(date);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (tomorrow <= new Date()) {
      setDate(tomorrow);
    }
  };

  const handleToday = () => {
    setDate(new Date());
  };

  const handleEditClick = (year: number, text: string) => {
    setEditingYear(year);
    setNewText(text);
  };

  const handleSaveClick = async (year: number) => {
    const existingEntry = entries[year];
    if (existingEntry) {
      // Update existing entry
      try {
        await axios.put(`${API_URL}/${existingEntry.id}`, {
          ...existingEntry,
          text: newText,
        });
        fetchEntries();
      } catch (error) {
        console.error("Error updating entry", error);
      }
    } else {
      // Create new entry
      try {
        await axios.post(API_URL, {
          text: newText,
          day: date.getDate(),
          month: date.getMonth() + 1,
          year,
        });
        fetchEntries();
      } catch (error) {
        console.error("Error creating entry", error);
      }
    }
    setEditingYear(null);
    setNewText("");
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewText(e.target.value);
  };

  const formattedDate = format(date, "d MMMM", { locale: fr });

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleDateChange = (value: any) => {
    if (value instanceof Date) {
      setDate(value);
    } else if (
      Array.isArray(value) &&
      value.length > 0 &&
      value[0] instanceof Date
    ) {
      setDate(value[0]);
    }
    closeModal();
  };

  const goToLastMissingDate = () => {
    if (missingDates.length > 0) {
      const lastMissingDate = missingDates[missingDates.length - 1];
      setDate(
        new Date(
          lastMissingDate.year,
          lastMissingDate.month - 1,
          lastMissingDate.day,
        ),
      );
    }
  };

  const getTileContent = ({ date, view }: TileContentProps) => {
    if (view === "month") {
      const isMissing = missingDates.some(
        (missingDate) =>
          missingDate.day === date.getDate() &&
          missingDate.month === date.getMonth() + 1,
      );

      if (isMissing) {
        return <span style={{ color: "red", fontWeight: "bold" }}>•</span>;
      }
    }
    return null;
  };

  return (
    <DiaryContainer>
      <DateNavigation>
        <Button onClick={goToLastMissingDate}>
          <GiReturnArrow />
        </Button>
        <Button onClick={openModal}>
          <FaCalendar />
        </Button>
        <Button onClick={handlePrevDay}>
          <FaChevronLeft />
        </Button>
        <DateDisplay>{formattedDate}</DateDisplay>
        <Button onClick={handleNextDay}>
          <FaChevronRight />
        </Button>
        <Button onClick={handleToday}>
          <FaDAndD />
        </Button>
      </DateNavigation>
      <DiaryEntry>
        {years.map((year) => (
          <EntryContainer key={year}>
            <EntryYear>{year}</EntryYear>
            {editingYear === year ? (
              <>
                <TextArea value={newText} onChange={handleTextChange} />
                <CharCount>
                  {newText.length} / {CHARACTER_LIMIT} caractères
                </CharCount>
                <EditButton onClick={() => handleSaveClick(year)}>
                  <MdSave />
                </EditButton>
              </>
            ) : (
              <>
                <EntryText>{entries[year]?.text || "À remplir"}</EntryText>
                <EditButton
                  onClick={() =>
                    handleEditClick(year, entries[year]?.text || "")
                  }
                >
                  <MdEdit />
                </EditButton>
              </>
            )}
          </EntryContainer>
        ))}
      </DiaryEntry>
      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        contentLabel="Select Date"
      >
        <Calendar
          onChange={handleDateChange}
          value={date}
          tileContent={getTileContent}
        />
        <Button onClick={closeModal}>Fermer</Button>
      </Modal>
    </DiaryContainer>
  );
};

// Styles
const DiaryContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  max-width: 100vw;
  overflow-x: hidden;
  @media (max-width: 768px) {
    padding: 10px;
  }
`;

const DateNavigation = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  justify-content: center;
  width: 100%;

  button {
    flex: 1;
    min-width: 40px;
    max-width: 80px;
    white-space: pre-wrap; /* Allow button text to wrap */
  }
`;

const DateDisplay = styled.span`
  margin: 0 10px;
  @media (max-width: 768px) {
    margin: 5px 0;
    flex-basis: 100%;
    text-align: center;
  }
`;

const DiaryEntry = styled.div`
  margin-bottom: 20px;
  width: 100%;
  max-width: 600px;
  @media (max-width: 768px) {
    max-width: 100%;
    padding: 0 10px;
  }
`;

const EntryContainer = styled.div`
  margin-bottom: 10px;
  word-break: break-word; /* Ensure text does not overflow */
`;

const EntryYear = styled.h2`
  margin: 10px 0;
`;

const EntryText = styled.p`
  white-space: pre-wrap; /* preserve whitespace */
  word-break: break-word; /* Ensure text does not overflow */
`;

const Button = styled.button`
  margin: 0 5px;
  @media (max-width: 768px) {
    margin: 5px 0;
    width: 100%;
  }
`;

const EditButton = styled.button`
  margin-left: 10px;
  @media (max-width: 768px) {
    margin: 10px 0;
    width: 100%;
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  height: 100px;
  @media (max-width: 768px) {
    width: calc(100% - 20px);
    padding: 10px;
  }
`;

const CharCount = styled.div`
  font-size: 12px;
  color: ${(props) => props.color || "gray"};
  margin-top: 5px;
  text-align: right;
`;

export default Diary;
