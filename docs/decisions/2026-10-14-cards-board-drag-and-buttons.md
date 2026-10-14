# Who does what: a two-column cards board, drag and buttons are one action

2026-10-14. Lutan, looking at the live page: unreadable Move buttons, cards too big, Also allowed in the wrong place, and "maybe even a drop and drag with two columns".

- **Contrast.** `CardButton` put the primary and the neutral colour classes on one element; Tailwind settles that by stylesheet order, so Move rendered dark on dark. It is now one branch per kind (danger, move, primary). The same appended-class shape exists in `MapEditor.tsx` (`border-primary` over the base border); it is readable there and was left alone.
- **Layout.** `CardBoard.tsx`: Available cards on the left, the role's cards on the right in home-screen order, compact tiles (name, two lines of description, an includes note) in a grid like the dashboard's. Below `md` the role's cards come first and everything stacks. Also allowed now sits below the board.
- **One action.** A drop calls `runCardOp()`, the function the buttons call, so it takes the same server action (`addCard` / `removeCard` / `moveCard`) and leaves the same audit row. Dragging to a position is the Move action repeated once per step, never a new "set order" action. `actions.ts` is untouched.
- **Both exist** because there are no PCs on site, the Director uses a phone, and a keyboard cannot drag. Native HTML5 drag, as the maintenance board does; no library added.
- Not changed: the set of cards, what any card grants, the 56-row Details view, the left-hand menu.
