import React, { useState } from "react";
import styled from "styled-components";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
`;

const vizereMonths = [
  "Janvium",
  "Févrium",
  "Marsum",
  "Avrilum",
  "Mayum",
  "Juinum",
  "Juillum",
  "Aoûtum",
  "Septembrum",
  "Octobrum",
  "Novembrum",
  "Décembrum",
  "Perfektum",
];

const monthDays = [28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 29]; // Adjusted for Perfektum having 29 days

// Checks if a Gregorian year is a leap year
function isGregorianLeapYear(year: number) {
  if (year % 4 !== 0) return false;
  if (year % 100 !== 0) return true;
  return year % 400 === 0;
}

// Convert a Gregorian date to a Vizère date
function gregorianToVizere(gregorianDate: Date) {
  const vizereStart = new Date(gregorianDate.getFullYear() - 1, 11, 21); // December 21st of the previous year
  const diff = gregorianDate.getTime() - vizereStart.getTime();
  const daysSinceStart = Math.floor(diff / (1000 * 60 * 60 * 24));

  let days = daysSinceStart;
  let year = 0;

  while (days >= 365) {
    days -= isGregorianLeapYear(vizereStart.getFullYear() + year) ? 366 : 365;
    year++;
  }

  let month = 0;
  while (days >= monthDays[month]) {
    days -= monthDays[month];
    month++;
  }

  return { year, month: vizereMonths[month], day: days + 1 };
}

// Convert a Vizère date to a Gregorian date
function vizereToGregorian(year: number, month: string, day: number) {
  const vizereStart = new Date(2049, 11, 21); // December 21, 2049, starts year 0 of Vizère
  let days = 0;

  for (let i = 0; i < year; i++) {
    days += isGregorianLeapYear(vizereStart.getFullYear() + i) ? 366 : 365;
  }

  const monthIndex = vizereMonths.indexOf(month);
  for (let i = 0; i < monthIndex; i++) {
    days += monthDays[i];
  }

  days += day - 1;
  vizereStart.setDate(vizereStart.getDate() + days);
  return vizereStart;
}

const DateConverter = () => {
  const [gregorianDate, setGregorianDate] = useState("");
  const [vizereYear, setVizereYear] = useState(0);
  const [vizereMonth, setVizereMonth] = useState("Janvium");
  const [vizereDay, setVizereDay] = useState(1);
  const [resultDate, setResultDate] = useState("");

  const handleGregorianToVizere = (e: any) => {
    e.preventDefault();
    const date = new Date(gregorianDate);
    const { year, month, day } = gregorianToVizere(date);
    setResultDate(`Vizère Date: Year ${year}, Month ${month}, Day ${day}`);
  };

  const handleVizereToGregorian = (e: any) => {
    e.preventDefault();
    const date = vizereToGregorian(vizereYear, vizereMonth, vizereDay);
    setResultDate(`Gregorian Date: ${date.toDateString()}`);
  };

  return (
    <Container>
      <h1>Date Conversion Tool</h1>
      <form onSubmit={handleGregorianToVizere}>
        <input
          type="date"
          value={gregorianDate}
          onChange={(e) => setGregorianDate(e.target.value)}
        />
        <button type="submit">Convert to Vizère Date</button>
      </form>
      <form onSubmit={handleVizereToGregorian}>
        <input
          type="number"
          value={vizereYear}
          onChange={(e) => setVizereYear(parseInt(e.target.value))}
        />
        <select
          value={vizereMonth}
          onChange={(e) => setVizereMonth(e.target.value)}
        >
          {vizereMonths.map((month, index) => (
            <option key={index} value={month}>
              {month}
            </option>
          ))}
        </select>
        <input
          type="number"
          value={vizereDay}
          onChange={(e) => setVizereDay(parseInt(e.target.value))}
        />
        <button type="submit">Convert to Gregorian Date</button>
      </form>
      {resultDate && <p>{resultDate}</p>}
    </Container>
  );
};

export default DateConverter;
