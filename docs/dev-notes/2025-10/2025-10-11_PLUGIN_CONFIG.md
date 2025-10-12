# Plugin Configuration Flow - Drag & Drop Mechanics

**Date:** 2025-10-11  
**Status:** Design Phase - UI Mechanics First

## Core Concept
Insert plugins (Row/Column/Table/Cell) are **configured by dropping filter slots onto them**, then **dragged into table sections** to determine scope.

## Drag-Drop Flow
### Step 1: Configure Insert Plugin
1. User opens "In" mode → clicks Row/Column/Table/Cell button
2. Dropdown shows preview toolbar with drop zone (left content)
3. User drags filter slot from PluginInsert
4. Drops slot onto preview toolbar drop zone
5. Preview activates - shows filter icon, becomes draggable

### Step 2: Place in Table
6. User drags activated preview
7. Drops into table section
8. Drop location determines scope

## Next Steps
1. Make slots draggable
2. Add drop zones to previews  
3. Implement slot → preview drop
4. Make activated previews draggable
5. Add table section drop zones
6. Polish visual feedback

**Priority:** Get slot → preview drag-drop working first
