I want to create app like [https://www.atlassian.com/software/jira](https://www.atlassian.com/software/jira) and [https://www.sunsama.com/](https://www.sunsama.com/)

- Only for Frontend using Nuxt4 with SSR Off. 
- Data save in local storage 
- Website was public without login

### Group Section on Sidebar

Focus

Work

- Task
- Sprint
- Epics

---

## Home

Kanban 

- For Next 4 Day (Today, Today + 1, +2, +3)
- Calendar View. Only for Today. List 00:00 - 23.59. 
  - User can drag Today Task to Today Calendar to set which time this ticket will working.
  - It' also will change or update Time when working



---

## Work

Task

- Title
- Description
- Priority (High, Medium, Low)
- Due Date
- Sprint 
- Epics
- Time when working Date and Time Range
- Status (Backlog, Todo, In Progress, Done, Canceled)



Sprint 

- Name
- Date Started 
- Date Ended



Epics

- Name
- Description
- Due Date
- Priority (High, Medium, Low)
- Color



Menu 

- Task. There's 3 Tab:
  - List Down categorized by Sprint
  - Kanban based on  Task Status (Backlog, Todo, In Progress, Done, Canceled)
- Sprint
  - List Down categorized by (Active, Future, Archived)
  - When Archived Click, show the detail. have 3 different section
    - Daily productivity: bar chart per day, show percentage epics each day
    - How you spent your time: donut chart total percentage epics from that sprint 
    - Kanban with Date on header. 
      - Date based on Date Started - Date Ended, horizontal scrollable. 
      - in each day there's task that pick based on Time when working this (Date and Time Range )in Array
- Epics
  - Gantt 



User Experience (Keyboard)

- Escape to cancel or close modal
- Task can Right Click then show option like (delete)
- Task can drag and drop



&nbsp;

&nbsp;