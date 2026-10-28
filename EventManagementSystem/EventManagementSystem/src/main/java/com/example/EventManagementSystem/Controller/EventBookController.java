package com.example.EventManagementSystem.Controller;

import java.util.List;

import org.springframework.web.bind.annotation.*;

import com.example.EventManagementSystem.Model.Events;
import com.example.EventManagementSystem.Model.Bookings;
import com.example.EventManagementSystem.Service.EventBookService;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class EventBookController {

    private final EventBookService eventBookService;

    public EventBookController(EventBookService eventBookService) {
        this.eventBookService = eventBookService;
    }

    // Get all events
    @GetMapping("/events")
    public List<Events> getAllEvents() {
        return eventBookService.getAllEvents();
    }

    // Add one event
    @PostMapping("/events")
    public Events addEvent(@RequestBody Events event) {
        return eventBookService.addEvent(event);
    }

    // Add multiple events
    @PostMapping("/events/bulk")
    public List<Events> addEvents(@RequestBody List<Events> events) {
        return eventBookService.addEvents(events);
    }

    // Update event
    @PutMapping("/events/{id}")
    public Events updateEvent(@PathVariable Integer id,
                              @RequestBody Events event) {
        return eventBookService.updateEvent(id, event);
    }

    // Delete event
    @DeleteMapping("/events/{id}")
    public String deleteEvent(@PathVariable Integer id) {
        eventBookService.deleteEvent(id);
        return "Event deleted successfully";
    }

    // Get all bookings
    @GetMapping("/bookings")
    public List<Bookings> getAllBookings() {
        return eventBookService.getAllBookings();
    }

    // Add booking
    @PostMapping("/bookings")
    public Bookings addBooking(@RequestBody Bookings booking) {
        return eventBookService.addBooking(booking);
    }

}
