"use client";

import {
  CheckIcon,
  ChevronRightIcon,
  DotFilledIcon,
} from "@radix-ui/react-icons";
import {
  ItemIndicator,
  CheckboxItem as MenubarCheckboxItemPrimitive,
  Content as MenubarContentPrimitive,
  Group as MenubarGroupPrimitive,
  Item as MenubarItemPrimitive,
  Label as MenubarLabelPrimitive,
  Menu as MenubarMenuPrimitive,
  Portal as MenubarPortalPrimitive,
  RadioGroup as MenubarRadioGroupPrimitive,
  RadioItem as MenubarRadioItemPrimitive,
  Root as MenubarRoot,
  Separator as MenubarSeparatorPrimitive,
  SubContent as MenubarSubContentPrimitive,
  Sub as MenubarSubPrimitive,
  SubTrigger as MenubarSubTriggerPrimitive,
  Trigger as MenubarTriggerPrimitive,
} from "@radix-ui/react-menubar";
import type {
  ComponentProps,
  ComponentPropsWithoutRef,
  ElementRef,
  HTMLAttributes,
} from "react";
import React, { forwardRef } from "react";
import { cn } from "@/utils/cn";

function MenubarMenu({
  ...props
}: ComponentProps<typeof MenubarMenuPrimitive>) {
  return <MenubarMenuPrimitive {...props} />;
}

function MenubarGroup({
  ...props
}: ComponentProps<typeof MenubarGroupPrimitive>) {
  return <MenubarGroupPrimitive {...props} />;
}

function MenubarPortal({
  ...props
}: ComponentProps<typeof MenubarPortalPrimitive>) {
  return <MenubarPortalPrimitive {...props} />;
}

function MenubarRadioGroup({
  ...props
}: ComponentProps<typeof MenubarRadioGroupPrimitive>) {
  return <MenubarRadioGroupPrimitive {...props} />;
}

function MenubarSub({ ...props }: ComponentProps<typeof MenubarSubPrimitive>) {
  return <MenubarSubPrimitive data-slot="menubar-sub" {...props} />;
}

const Menubar = forwardRef<
  ElementRef<typeof MenubarRoot>,
  ComponentPropsWithoutRef<typeof MenubarRoot>
>(({ className, ...props }, ref) => (
  <MenubarRoot
    className={cn(
      "flex h-9 items-center space-x-1 rounded-md border bg-background p-1 shadow-sm",
      className
    )}
    ref={ref}
    {...props}
  />
));
Menubar.displayName = MenubarRoot.displayName;

const MenubarTrigger = forwardRef<
  ElementRef<typeof MenubarTriggerPrimitive>,
  ComponentPropsWithoutRef<typeof MenubarTriggerPrimitive>
>(({ className, ...props }, ref) => (
  <MenubarTriggerPrimitive
    className={cn(
      "flex cursor-default select-none items-center rounded-sm px-3 py-1 font-medium text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground",
      className
    )}
    ref={ref}
    {...props}
  />
));
MenubarTrigger.displayName = MenubarTriggerPrimitive.displayName;

const MenubarSubTrigger = forwardRef<
  ElementRef<typeof MenubarSubTriggerPrimitive>,
  ComponentPropsWithoutRef<typeof MenubarSubTriggerPrimitive> & {
    inset?: boolean;
  }
>(({ className, inset, children, ...props }, ref) => (
  <MenubarSubTriggerPrimitive
    className={cn(
      "flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground",
      inset && "pl-8",
      className
    )}
    ref={ref}
    {...props}
  >
    {children}
    <ChevronRightIcon className="ml-auto h-4 w-4" />
  </MenubarSubTriggerPrimitive>
));
MenubarSubTrigger.displayName = MenubarSubTriggerPrimitive.displayName;

const MenubarSubContent = forwardRef<
  ElementRef<typeof MenubarSubContentPrimitive>,
  ComponentPropsWithoutRef<typeof MenubarSubContentPrimitive>
>(({ className, ...props }, ref) => (
  <MenubarSubContentPrimitive
    className={cn(
      "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 min-w-[8rem] origin-[--radix-menubar-content-transform-origin] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=closed]:animate-out data-[state=open]:animate-in",
      className
    )}
    ref={ref}
    {...props}
  />
));
MenubarSubContent.displayName = MenubarSubContentPrimitive.displayName;

const MenubarContent = forwardRef<
  ElementRef<typeof MenubarContentPrimitive>,
  ComponentPropsWithoutRef<typeof MenubarContentPrimitive>
>(
  (
    { className, align = "start", alignOffset = -4, sideOffset = 8, ...props },
    ref
  ) => (
    <MenubarPortalPrimitive>
      <MenubarContentPrimitive
        align={align}
        alignOffset={alignOffset}
        className={cn(
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 min-w-[12rem] origin-[--radix-menubar-content-transform-origin] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in",
          className
        )}
        ref={ref}
        sideOffset={sideOffset}
        {...props}
      />
    </MenubarPortalPrimitive>
  )
);
MenubarContent.displayName = MenubarContentPrimitive.displayName;

const MenubarItem = forwardRef<
  ElementRef<typeof MenubarItemPrimitive>,
  ComponentPropsWithoutRef<typeof MenubarItemPrimitive> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <MenubarItemPrimitive
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      inset && "pl-8",
      className
    )}
    ref={ref}
    {...props}
  />
));
MenubarItem.displayName = MenubarItemPrimitive.displayName;

const MenubarCheckboxItem = forwardRef<
  ElementRef<typeof MenubarCheckboxItemPrimitive>,
  ComponentPropsWithoutRef<typeof MenubarCheckboxItemPrimitive>
>(({ className, children, checked, ...props }, ref) => (
  <MenubarCheckboxItemPrimitive
    checked={checked}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pr-2 pl-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    ref={ref}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <ItemIndicator>
        <CheckIcon className="h-4 w-4" />
      </ItemIndicator>
    </span>
    {children}
  </MenubarCheckboxItemPrimitive>
));
MenubarCheckboxItem.displayName = MenubarCheckboxItemPrimitive.displayName;

const MenubarRadioItem = forwardRef<
  ElementRef<typeof MenubarRadioItemPrimitive>,
  ComponentPropsWithoutRef<typeof MenubarRadioItemPrimitive>
>(({ className, children, ...props }, ref) => (
  <MenubarRadioItemPrimitive
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pr-2 pl-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    ref={ref}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <ItemIndicator>
        <DotFilledIcon className="h-4 w-4 fill-current" />
      </ItemIndicator>
    </span>
    {children}
  </MenubarRadioItemPrimitive>
));
MenubarRadioItem.displayName = MenubarRadioItemPrimitive.displayName;

const MenubarLabel = forwardRef<
  ElementRef<typeof MenubarLabelPrimitive>,
  ComponentPropsWithoutRef<typeof MenubarLabelPrimitive> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <MenubarLabelPrimitive
    className={cn(
      "px-2 py-1.5 font-semibold text-sm",
      inset && "pl-8",
      className
    )}
    ref={ref}
    {...props}
  />
));
MenubarLabel.displayName = MenubarLabelPrimitive.displayName;

const MenubarSeparator = forwardRef<
  ElementRef<typeof MenubarSeparatorPrimitive>,
  ComponentPropsWithoutRef<typeof MenubarSeparatorPrimitive>
>(({ className, ...props }, ref) => (
  <MenubarSeparatorPrimitive
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    ref={ref}
    {...props}
  />
));
MenubarSeparator.displayName = MenubarSeparatorPrimitive.displayName;

const MenubarShortcut = ({
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn(
        "ml-auto text-muted-foreground text-xs tracking-widest",
        className
      )}
      {...props}
    />
  );
};
MenubarShortcut.displayname = "MenubarShortcut";

export {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
  MenubarSeparator,
  MenubarLabel,
  MenubarCheckboxItem,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarPortal,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarGroup,
  MenubarSub,
  MenubarShortcut,
};
