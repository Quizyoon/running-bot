import { buildConfirmCard } from "./flex/confirmCard";

const sampleData = {
  distanceKm: 5.2,
  durationSec: 1694,
  durationDisplay: "28:14",
  paceMinPerKm: 5.43,
  paceDisplay: "5'26\"",
  runDate: new Date().toISOString().split("T")[0],
};

const card = buildConfirmCard("test_123", "Kay", sampleData, []);

// Flex Message의 contents 부분만 출력 (Simulator에 붙여넣기용)
console.log(JSON.stringify(card.contents, null, 2));
