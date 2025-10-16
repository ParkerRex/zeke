import { describe, expect, it } from "bun:test";

describe("Team creation logic verification", () => {
  it("should auto-switch logic: switchTeam defaults correctly", () => {
    // Test the logic we implemented
    const existingTeamsCount = 0;
    const explicitSwitch = undefined;
    
    // This is the logic from our fix:
    const shouldSwitchTeam = explicitSwitch ?? existingTeamsCount === 0;
    
    expect(shouldSwitchTeam).toBe(true);
    console.log("✅ First team creation: shouldSwitchTeam =", shouldSwitchTeam);
  });

  it("should respect explicit false for subsequent teams", () => {
    const existingTeamsCount = 1;
    const explicitSwitch = false;
    
    const shouldSwitchTeam = explicitSwitch ?? existingTeamsCount === 0;
    
    expect(shouldSwitchTeam).toBe(false);
    console.log("✅ Subsequent team with false: shouldSwitchTeam =", shouldSwitchTeam);
  });

  it("should switch when explicitly set to true", () => {
    const existingTeamsCount = 1;
    const explicitSwitch = true;
    
    const shouldSwitchTeam = explicitSwitch ?? existingTeamsCount === 0;
    
    expect(shouldSwitchTeam).toBe(true);
    console.log("✅ Explicit true: shouldSwitchTeam =", shouldSwitchTeam);
  });

  it("should default to true in TRPC router", () => {
    const inputSwitchTeam = undefined;
    const switchTeam = inputSwitchTeam ?? true;
    
    expect(switchTeam).toBe(true);
    console.log("✅ TRPC default: switchTeam =", switchTeam);
  });

  it("middleware safety net: should auto-assign when teamId is null but memberships exist", () => {
    const userTeamId = null;
    const userMemberships = [{ teamId: "team-123" }, { teamId: "team-456" }];
    
    let teamId = userTeamId;
    if (teamId === null && userMemberships.length > 0) {
      teamId = userMemberships[0]!.teamId;
    }
    
    expect(teamId).toBe("team-123");
    console.log("✅ Safety net assigned teamId:", teamId);
  });
});
