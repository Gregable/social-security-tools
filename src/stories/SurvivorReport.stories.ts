import type { Meta } from "@storybook/svelte";
import SurvivorReport from "../lib/components/SurvivorReport.svelte";

import { Recipient } from "$lib/recipient";
import { parsePaste } from "$lib/ssa-parse";
import { Birthdate } from "$lib/birthday";

import demo from "$lib/pastes/averagepaste.txt?raw";
import demo_spouse_low from "$lib/pastes/averagepaste-spouse.txt?raw";

const meta: Meta<SurvivorReport> = {
  component: SurvivorReport,
  title: "Report/Survivor/SurvivorReport",
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
};
export default meta;

const Template = ({ ...args }) => ({
  Component: SurvivorReport,
  props: args,
});

let recipient = new Recipient();
recipient.name = "Alex";
recipient.markFirst();
recipient.earningsRecords = parsePaste(demo);
recipient.birthdate = Birthdate.FromYMD(1950, 6, 1);

let spouse = new Recipient();
spouse.name = "Chris";
spouse.markSecond();
spouse.earningsRecords = parsePaste(demo_spouse_low);
spouse.birthdate = Birthdate.FromYMD(1950, 6, 1);

// Default is someone with sufficient earned credits.
export const Default = Template.bind({});
Default.args = {
  recipient: recipient,
  spouse: spouse,
};

let recipient2 = new Recipient();
recipient2.name = "Alex";
recipient2.markFirst();
recipient2.earningsRecords = parsePaste(demo);
recipient2.birthdate = Birthdate.FromYMD(1942, 6, 1);

let spouse2 = new Recipient();
spouse2.name = "Chris";
spouse2.markSecond();
spouse2.earningsRecords = parsePaste(demo_spouse_low);
spouse2.birthdate = Birthdate.FromYMD(1942, 6, 1);

// Default is someone with sufficient earned credits.
export const Older1942 = Template.bind({});
Older1942.args = {
  recipient: recipient2,
  spouse: spouse2,
};
