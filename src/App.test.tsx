import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "./App";

function mockGeolocation(impl: Geolocation["getCurrentPosition"]) {
  Object.defineProperty(navigator, "geolocation", {
    configurable: true,
    value: { getCurrentPosition: impl },
  });
}

const fetchMock = vi.fn();

beforeEach(() => {
  localStorage.clear();
  fetchMock.mockReset();
  fetchMock.mockResolvedValue({
    ok: true,
    json: async () => ({ address: { city: "Stockholm", country: "Sweden" } }),
  } as Response);
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => {
  Reflect.deleteProperty(navigator, "geolocation");
  vi.unstubAllGlobals();
});

it("hides the moon until a guess is submitted, then reveals and resets", async () => {
  const user = userEvent.setup();
  render(<App />);
  expect(screen.queryByRole("img", { name: /current moon/i })).toBeNull();
  expect(screen.getByLabelText(/how full/i)).toHaveAttribute(
    "inputmode",
    "numeric",
  );

  await user.clear(screen.getByLabelText(/how full/i));
  await user.type(screen.getByLabelText(/how full/i), "42");
  await user.click(screen.getByRole("button", { name: "Guess" }));

  expect(
    screen.getByRole("img", { name: /current moon/i }),
  ).toBeInTheDocument();
  expect(screen.getByText(/you guessed 42%/i)).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: /play again/i }));
  expect(screen.getByRole("button", { name: "Guess" })).toBeInTheDocument();
});

it("shows the player location and moon sky info after a guess", async () => {
  mockGeolocation((ok) =>
    ok({
      coords: { latitude: 59.3293, longitude: 18.0686, accuracy: 2500 },
    } as GeolocationPosition),
  );
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole("button", { name: "Guess" }));
  expect(await screen.findByText("59.33° N, 18.07° E")).toBeInTheDocument();
  expect(await screen.findByText("Stockholm, Sweden")).toBeInTheDocument();
  expect(
    screen.getByText(/moon is (up|down) \(-?\d+°, (N|NE|E|SE|S|SW|W|NW)\)/i),
  ).toBeInTheDocument();
});

it("shows only the error when location is denied", async () => {
  mockGeolocation((_ok, fail) =>
    fail?.({ code: 1 } as GeolocationPositionError),
  );
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole("button", { name: "Guess" }));
  expect(
    await screen.findByText(/location permission denied/i),
  ).toBeInTheDocument();
  expect(screen.queryByText(/moon is (up|down)/i)).toBeNull();
  expect(fetchMock).not.toHaveBeenCalled();
});

it("blocks out-of-range guesses", async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.clear(screen.getByLabelText(/how full/i));
  await user.type(screen.getByLabelText(/how full/i), "150");
  expect(screen.getByRole("button", { name: "Guess" })).toBeDisabled();
  expect(screen.getByRole("alert")).toBeInTheDocument();
});
