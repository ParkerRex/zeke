"use client";

import { useUserQuery } from "@/hooks/use-user";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@zeke/ui/alert-dialog";
import { Button } from "@zeke/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@zeke/ui/card";
import { Input } from "@zeke/ui/input";
import { Label } from "@zeke/ui/label";
import { useState } from "react";

export function DeleteTeam() {
  const [value, setValue] = useState("");
  const { data: user } = useUserQuery();

  const [value, setValue] = useState("");

  return (
    <Card className="border-destructive">
      <CardHeader>
        <CardTitle>Delete team</CardTitle>
        <CardDescription>
          Permanently remove your Team and all of its contents from the zeke
          platform. This action is not reversible — please continue with
          caution.
        </CardDescription>
      </CardHeader>
      <CardFooter className="flex justify-between">
        <div />

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="destructive"
              className="hover:bg-destructive text-muted"
            >
              Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your
                team and remove your data from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="mt-2 flex flex-col gap-2">
              <Label htmlFor="confirm-delete">
                Type <span className="font-medium">DELETE</span> to confirm.
              </Label>
              <Input
                id="confirm-delete"
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction disabled>
                Coming Soon
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
}
