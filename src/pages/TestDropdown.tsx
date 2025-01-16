import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useState } from "react";

const TestDropdown = () => {
  const [selected, setSelected] = useState<string | null>(null);
  const options = ["Option 1", "Option 2", "Option 3"];

  return (
    <div>
      <h2>Select an Option</h2>
      <Select onValueChange={setSelected} className="w-32 bg-white rounded-md shadow-md border border-gray-300">
        <SelectTrigger>
          <SelectValue placeholder="Select" />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {selected && <p>You selected: {selected}</p>}
    </div>
  );
};

export default TestDropdown; 