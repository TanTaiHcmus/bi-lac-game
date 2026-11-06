"use client";

import { useState, type FormEvent } from "react";
import { Pencil, Trash2, UserPlus } from "lucide-react";
import { addPlayer, removePlayer, renamePlayer } from "@/app/actions";
import { MAX_NAME_LENGTH, formatPoints } from "@/lib/format";
import { useToast } from "./toast";
import { Avatar, Button, EmptyState, ErrorText, ListGroup, inputClass } from "./ui";
import { useAction } from "./use-action";

type PlayerRow = { id: number; name: string; played: number; points: number };

export function PlayerManager({ players }: { players: PlayerRow[] }) {
  return (
    <div className="space-y-5">
      <AddPlayerForm />
      {players.length === 0 ? (
        <EmptyState>Chưa có ai. Thêm người chơi đầu tiên ở trên nhé.</EmptyState>
      ) : (
        <ListGroup label="Danh sách người chơi">
          {players.map((player) => (
            <PlayerItem key={player.id} player={player} />
          ))}
        </ListGroup>
      )}
    </div>
  );
}

function AddPlayerForm() {
  const [name, setName] = useState("");
  const { pending, error, run } = useAction();
  const toast = useToast();

  function submit(event: FormEvent) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    run(
      () => addPlayer(trimmed),
      () => {
        setName("");
        toast(`Đã thêm ${trimmed}.`);
      },
    );
  }

  return (
    <div>
      <form onSubmit={submit} className="flex gap-2">
        <label htmlFor="new-player" className="sr-only">
          Tên người chơi mới
        </label>
        <input
          id="new-player"
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={MAX_NAME_LENGTH}
          placeholder="Tên người chơi mới"
          autoComplete="off"
          className={inputClass}
        />
        <Button type="submit" variant="pitch" size="lg" loading={pending} disabled={!name.trim()}>
          {!pending && <UserPlus aria-hidden className="size-5" />}
          Thêm
        </Button>
      </form>
      {error && (
        <div className="mt-2 px-1">
          <ErrorText>{error}</ErrorText>
        </div>
      )}
    </div>
  );
}

function PlayerItem({ player }: { player: PlayerRow }) {
  const [mode, setMode] = useState<"view" | "edit" | "delete">("view");
  const [name, setName] = useState(player.name);
  const { pending, error, setError, run } = useAction();
  const toast = useToast();

  function show(next: typeof mode) {
    setMode(next);
    setName(player.name);
    setError(null);
  }

  function rename(event: FormEvent) {
    event.preventDefault();
    run(
      () => renamePlayer(player.id, name),
      () => {
        setMode("view");
        toast("Đã đổi tên.");
      },
    );
  }

  if (mode === "edit") {
    return (
      <li className="px-4 py-3">
        <form onSubmit={rename} className="flex items-center gap-2">
          <input
            autoFocus
            aria-label={`Tên mới cho ${player.name}`}
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={MAX_NAME_LENGTH}
            className={inputClass}
          />
          <Button type="submit" variant="pitch" size="lg" loading={pending} disabled={!name.trim()}>
            Lưu
          </Button>
          <Button variant="ghost" size="lg" disabled={pending} onClick={() => show("view")}>
            Hủy
          </Button>
        </form>
        {error && (
          <div className="mt-2">
            <ErrorText>{error}</ErrorText>
          </div>
        )}
      </li>
    );
  }

  if (mode === "delete") {
    return (
      <li className="bg-rose-50 px-4 py-3">
        <p className="text-sm text-zinc-700">
          Xóa <strong className="text-zinc-900">{player.name}</strong>?
          {player.played > 0 && " Lịch sử trận đấu vẫn được giữ lại."}
        </p>
        <div className="mt-2 flex gap-2">
          <Button variant="secondary" disabled={pending} onClick={() => show("view")}>
            Hủy
          </Button>
          <Button
            variant="danger"
            loading={pending}
            onClick={() => run(() => removePlayer(player.id), () => toast(`Đã xóa ${player.name}.`))}
          >
            Xóa
          </Button>
        </div>
        {error && (
          <div className="mt-2">
            <ErrorText>{error}</ErrorText>
          </div>
        )}
      </li>
    );
  }

  return (
    <li className="flex items-center gap-3 py-2.5 pr-2 pl-4">
      <Avatar player={player} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-zinc-900">{player.name}</p>
        <p className="text-xs text-zinc-500 tabular-nums">
          {player.played} trận · {formatPoints(player.points)} điểm
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Đổi tên ${player.name}`}
        title="Đổi tên"
        onClick={() => show("edit")}
      >
        <Pencil aria-hidden className="size-4" />
      </Button>
      <Button
        variant="ghostDanger"
        size="icon"
        aria-label={`Xóa ${player.name}`}
        title="Xóa"
        onClick={() => show("delete")}
      >
        <Trash2 aria-hidden className="size-4" />
      </Button>
    </li>
  );
}
